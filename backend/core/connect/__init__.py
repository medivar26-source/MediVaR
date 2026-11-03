"""
Dashboard <-> Quest 3 connectivity: the pure rules.

Nothing here touches a database, the network or a clock it was not handed, so every rule can be tested on its
own. The service in `services/connect_service.py` and the endpoints in `api/v1/endpoints/connect.py` are thin
shells around these modules.

Design: mediver_documentation/23_VR_CONNECTIVITY_DESIGN.md
Headset side: the "Web Dashboard <-> Quest 3 Connectivity" plan of 2026-10-23.
"""
