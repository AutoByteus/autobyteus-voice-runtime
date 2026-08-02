# Third-party notices

The AutoByteus Voice Input runtime redistributes the following pinned inputs.
The release archive includes this notice, the corresponding files in `licenses/`,
and the bundled Node distribution's upstream `LICENSE` file.

| Component | Version / identity | License / notice |
| --- | --- | --- |
| Node.js | 22.23.1 official platform archives | Node upstream `LICENSE` (bundled from the verified archive) |
| sherpa-onnx Node wrapper and native package | 1.13.4, native identity `14280725` | Apache-2.0; see `licenses/SHERPA-ONNX-APACHE-2.0.txt` |
| opencc-js | 1.4.1 | MIT AND Apache-2.0; see `licenses/OPENCC-JS-LICENSE.txt` |
| SenseVoiceSmall INT8 model | `sensevoice-small-int8-2024-07-17`, weight SHA-256 `c71f0ce0…a2cd51` | SenseVoice/FunASR model terms; see `licenses/SENSEVOICE-LICENSE.txt` and `licenses/FUNASR-MODEL-LICENSE.txt` |
| OpenAI Whisper Small model (preservation candidate only) | sherpa-onnx INT8 conversion, encoder SHA-256 `4cbe7b22…9f33a9` | MIT; see `licenses/OPENAI-WHISPER-MIT.txt` |

SenseVoiceSmall is attributed to FunAudioLLM / FunASR. The runtime's release
evidence gate requires an explicit reviewed redistribution decision and a passing
product-corpus model-selection lane before the model can be published. Source
presence or a successful candidate package build is not release authorization.
