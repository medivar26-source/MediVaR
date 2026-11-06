"""
The in-process relay behind the live stream: the newest frame per assignment, held in memory, handed to every
viewer the moment it arrives. Nothing here is stored (the database keeps a snapshot a second through
live_service.store_stream_frame, so the polling page and the report path are untouched), and nothing here
reaches past this process: a second backend worker would hold its own relay, which is the stated limit of the
LAN design (mediver_documentation/changes/live_stream_2026-11-06.md).

Rules:
  * one channel per assignment, created on first use, dropped when the last device and viewer are gone;
  * publish() replaces the frame and wakes every watcher; a slow viewer never queues frames, it misses them;
  * watchers are counted by the viewers' generators (enter/leave), and that count is what the device is told.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import AsyncIterator, Dict, Optional


@dataclass
class RelayFrame:
    seq: int
    width: int
    height: int
    jpeg: bytes
    captured_at: Optional[object]           # datetime or None
    received_at: float                      # time.monotonic()


@dataclass
class Channel:
    frame: Optional[RelayFrame] = None
    watchers: int = 0
    device_connected: bool = False
    generation: int = 0                     # bumps on every publish; watchers wait for a change
    cond: asyncio.Condition = field(default_factory=asyncio.Condition)


class LiveRelay:
    def __init__(self) -> None:
        self._channels: Dict[str, Channel] = {}

    def channel(self, assignment_id: str) -> Channel:
        ch = self._channels.get(assignment_id)
        if ch is None:
            ch = Channel()
            self._channels[assignment_id] = ch
        return ch

    def peek(self, assignment_id: str) -> Optional[Channel]:
        return self._channels.get(assignment_id)

    def watchers(self, assignment_id: str) -> int:
        ch = self._channels.get(assignment_id)
        return ch.watchers if ch else 0

    async def publish(self, assignment_id: str, frame: RelayFrame) -> bool:
        """Newest wins; an older seq arriving late changes nothing. True when the frame was taken."""
        ch = self.channel(assignment_id)
        if ch.frame is not None and ch.frame.seq >= frame.seq:
            return False
        async with ch.cond:
            ch.frame = frame
            ch.generation += 1
            ch.cond.notify_all()
        return True

    async def device_entered(self, assignment_id: str) -> None:
        self.channel(assignment_id).device_connected = True

    async def device_left(self, assignment_id: str) -> None:
        ch = self._channels.get(assignment_id)
        if ch is None:
            return
        ch.device_connected = False
        ch.frame = None                                   # a run that is gone leaves no picture behind
        async with ch.cond:
            ch.generation += 1
            ch.cond.notify_all()                          # viewers wake, see no device, and end
        self._drop_if_idle(assignment_id)

    async def watch(self, assignment_id: str, keepalive_seconds: float = 5.0) -> AsyncIterator[Optional[RelayFrame]]:
        """Yields each new frame as it lands; yields None every keepalive_seconds with nothing new (the HTTP
        layer writes a boundary then, so a proxy never times the connection out). Ends when the device leaves.
        Counts itself as a watcher for as long as it is consumed."""
        ch = self.channel(assignment_id)
        ch.watchers += 1
        try:
            seen = ch.generation
            if ch.frame is not None:
                yield ch.frame
            while True:
                async with ch.cond:
                    try:
                        await asyncio.wait_for(ch.cond.wait_for(lambda: ch.generation != seen), timeout=keepalive_seconds)
                    except asyncio.TimeoutError:
                        yield None
                        continue
                    seen = ch.generation
                if ch.frame is None:
                    if not ch.device_connected:
                        return
                    continue
                yield ch.frame
        finally:
            ch.watchers = max(0, ch.watchers - 1)
            self._drop_if_idle(assignment_id)

    def _drop_if_idle(self, assignment_id: str) -> None:
        ch = self._channels.get(assignment_id)
        if ch is not None and ch.watchers == 0 and not ch.device_connected:
            self._channels.pop(assignment_id, None)


relay = LiveRelay()


def now_monotonic() -> float:
    return time.monotonic()
