// MediVeR connectivity smoke test for the Unity Editor (or a development build).
//
// It talks to the MediVeR backend exactly as the headset contract says, independently of the Connect package,
// so a failure points at one side or the other:
//   1. GET  /health
//   2. POST /devices/pair            (with the 6-digit code from the dashboard's "Send to headset" box)
//   3. GET  /assignments/{id}/plan   (with the bearer token from step 2)
//   4. PUT  /assignments/{id}/runs/{runId}/report   (a test report that hits every planned value)
//
// How to use:
//   - Drop this file anywhere under Assets/ (it has no dependencies).
//   - Create an empty GameObject, add MediverConnectSmokeTest, type the code into "Code", press Play.
//     Every step is printed to the Console with its HTTP status.
//   - Player Settings > Other Settings > "Allow downloads over HTTP" must not be "Not allowed" (use
//     "Allowed in development builds"), or Unity refuses plain http://localhost.
//
// Expected for step 4: HTTP 200 with "scoring":"awaiting_inputs" and a "missing" list. This test report carries no
// sceneId / warnings per step, so the backend stores it but cannot score it. That proves the transport; scoring
// needs the fields in VR_TEAM_BRIEF.md.
//
// The code works once and expires 10 minutes after the dashboard showed it. Delete this file before shipping.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class MediverConnectSmokeTest : MonoBehaviour
{
    [Header("Backend")]
    [Tooltip("Editor on the same PC as the backend: http://localhost:8000/api/v1")]
    public string baseUrl = "http://localhost:8000/api/v1";

    [Header("Pairing")]
    [Tooltip("The 6-digit code from the dashboard's Send to headset box")]
    public string code = "";
    public string deviceId = "unity-editor-smoke-test";
    public bool runOnPlay = true;

    [Header("Filled in by the test")]
    public string assignmentId;
    public string tokenExpiresAt;
    [TextArea(3, 12)] public string lastResult;

    string token;
    CasePlan plan;

    void Start()
    {
        if (runOnPlay) StartCoroutine(RunAll());
    }

    [ContextMenu("Run all (Play mode)")]
    public void RunAllFromMenu()
    {
        if (Application.isPlaying) StartCoroutine(RunAll());
        else Debug.LogWarning("[MediVeR] Enter Play mode first: coroutines do not run in Edit mode.");
    }

    IEnumerator RunAll()
    {
        // 1. Health
        yield return Send("GET", "/health", null, null, (status, body) => Report("1 health", status, body));

        // 2. Pair
        if (string.IsNullOrWhiteSpace(code))
        {
            Debug.LogError("[MediVeR] Type the 6-digit code from the dashboard into 'Code', then press Play again.");
            yield break;
        }
        var pair = new PairRequest
        {
            code = code.Trim(), deviceId = deviceId, deviceName = "Unity Editor (smoke test)",
            appVersion = Application.version, schemaVersion = 1,
        };
        bool paired = false;
        yield return Send("POST", "/devices/pair", JsonUtility.ToJson(pair), null, (status, body) =>
        {
            Report("2 pair", status, body);
            if (status != 200) return;
            var res = JsonUtility.FromJson<PairResponse>(body);
            token = res.token;
            assignmentId = res.assignmentId;
            tokenExpiresAt = res.tokenExpiresAt;
            plan = res.casePlan;
            paired = true;
            var sb = new StringBuilder();
            sb.AppendLine($"Plan for {plan.trainee.displayName}: {plan.patient.label} ({plan.patient.side}, " +
                          $"{(string.IsNullOrEmpty(plan.patient.deformity) ? "deformity not recorded" : plan.patient.deformity)}), " +
                          $"{plan.mode}, {plan.difficulty}, {plan.design}/{plan.fixation}");
            foreach (var v in plan.values) sb.AppendLine($"  {v.key,-24} {v.value,7} ± {v.tolerance} {v.unit}");
            Debug.Log("[MediVeR] " + sb);
        });
        if (!paired) yield break;

        // 3. Plan again (what a resume does)
        yield return Send("GET", $"/assignments/{assignmentId}/plan", null, token, (status, body) => Report("3 plan", status, body));

        // 4. A test report that hits every planned value
        var now = DateTime.UtcNow;
        var report = new RunReport
        {
            assignmentId = assignmentId, runId = Guid.NewGuid().ToString(), caseId = plan.caseId, deviceId = deviceId,
            appVersion = Application.version, mode = plan.mode, outcome = "Completed",
            startedAtUtc = now.AddMinutes(-30).ToString("yyyy-MM-ddTHH:mm:ssZ"), endedAtUtc = now.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            durationSeconds = 1800, maxScore = 100, grade = "",
        };
        foreach (var v in plan.values)
        {
            if (v.key == "P1.flexionDeg" || v.key == "P4.implantSize") continue;
            report.steps.Add(new StepRecord
            {
                stepId = "smoke-" + v.key, partId = "", result = "Pass", attempts = 1, timeSeconds = 60, qualityFactor = 1,
                qualityNote = "", planKey = v.key, plannedValue = v.value, tolerance = v.tolerance,
                hasCommittedValue = true, committedValue = v.value,
            });
        }
        yield return Send("PUT", $"/assignments/{assignmentId}/runs/{report.runId}/report", JsonUtility.ToJson(report), token,
            (status, body) => Report("4 report", status, body));
    }

    IEnumerator Send(string method, string path, string json, string bearer, Action<long, string> done)
    {
        using (var req = new UnityWebRequest(baseUrl.TrimEnd('/') + path, method))
        {
            if (json != null) req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
            req.downloadHandler = new DownloadHandlerBuffer();
            // The backend parses bodies as JSON only: without this header a POST/PUT is refused with 422.
            req.SetRequestHeader("Content-Type", "application/json");
            if (!string.IsNullOrEmpty(bearer)) req.SetRequestHeader("Authorization", "Bearer " + bearer);
            req.timeout = 20;
            yield return req.SendWebRequest();
            var body = req.result == UnityWebRequest.Result.ConnectionError
                ? $"CONNECTION ERROR: {req.error} (is the backend running at {baseUrl}?)"
                : req.downloadHandler.text;
            done(req.responseCode, body);
        }
    }

    void Report(string step, long status, string body)
    {
        lastResult = $"{step}: HTTP {status}\n{body}";
        if (status >= 200 && status < 300) Debug.Log($"[MediVeR] {step}: HTTP {status}  {body}");
        else Debug.LogError($"[MediVeR] {step}: HTTP {status}  {body}");
    }

    // ----- contract DTOs (JsonUtility: public fields, lists not dictionaries, enums as strings) -----
    [Serializable] class PairRequest { public string code, deviceId, deviceName, appVersion; public int schemaVersion; }
    [Serializable] class PairResponse { public string assignmentId, token, tokenExpiresAt; public CasePlan casePlan; }
    [Serializable] public class CasePlan
    {
        public int schemaVersion;
        public string assignmentId, caseId, issuedAtUtc, mode, difficulty, design, fixation;
        public Patient patient; public Trainee trainee; public PlanValue[] values;
    }
    [Serializable] public class Patient { public string label, side, deformity, summary; public float deformityDeg; }
    [Serializable] public class Trainee { public string id, displayName, cohort, institution; }
    [Serializable] public class PlanValue { public string key, unit, label; public float value, tolerance; }
    [Serializable] class StepRecord
    {
        public string stepId, partId, result, planKey, qualityNote;
        public int attempts; public bool skipped, undone, hasCommittedValue;
        public float timeSeconds, points, qualityFactor, plannedValue, tolerance, committedValue;
    }
    [Serializable] class Measurement { public string key, unit; public float value, atSeconds; }
    [Serializable] class RunReport
    {
        public int schemaVersion = 1, reportRevision = 1;
        public string assignmentId, runId, caseId, deviceId, appVersion, mode, outcome, startedAtUtc, endedAtUtc, grade;
        public float deviceClockOffsetSeconds, durationSeconds, totalScore, maxScore;
        public List<StepRecord> steps = new List<StepRecord>();
        public List<Measurement> measurements = new List<Measurement>();
    }
}
