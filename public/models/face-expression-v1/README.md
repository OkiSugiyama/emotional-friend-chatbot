# Controlled camera model assets

Provenance: the four model files were copied from the `model/` directory of the
installed npm package `@vladmandic/face-api@1.7.15`. Its upstream project is
`vladmandic/face-api`; the package license is preserved as `LICENSE` in this
directory.

Review date: 2026-08-09. Review result: accepted for the P0, on-device-only
expression-estimation path. The application loads only the tiny face detector
and face-expression model from this same-origin directory. The adapter fails to
an explicit `unavailable` state when a required file is absent; it never
fabricates an expression or falls back to a remote model.

SHA-256 checksums:

```text
5b349c17c7836da506e03422cd6461c74085d8bb2713ad4114647dc5d28174c8  face_expression_model-weights_manifest.json
9a9840f2cf1f4c7eab95f197512569345c00d2426754d4608b92af30e0300f3d  face_expression_model.bin
5d1af4849ac48d5b985f4a9b16010c512353ddd6fcc63d50fd0bc9e9e64296e5  tiny_face_detector_model-weights_manifest.json
b7503ce7df31039b1c43316a9b865cab6a70dd748cc602d3fa28b551503c3871  tiny_face_detector_model.bin
```
