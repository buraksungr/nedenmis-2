# Nedenmiş Studio — Windows yerel seslendirme köprüsü (System.Speech / SAPI).
#
# Neden: Windows kurulumlarında Python/eSpeak NG bulunamazsa uygulamanın yine de
# gerçek ses üretebilmesi gerekir. Bu köprü, sistemde kurulu Türkçe sesi
# (Microsoft Tolga vb.) kullanır. Ses yoksa varsayılan sesle okur ve bunu bildirir.
#
# Kullanım:
#   powershell -NoProfile -ExecutionPolicy Bypass -File sapi_tts.ps1 -TextFile metin.txt -Out ses.wav
param(
  [Parameter(Mandatory = $true)][string]$TextFile,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Rate = 0
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

if (-not (Test-Path -LiteralPath $TextFile)) {
  Write-Error "Metin dosyası bulunamadı: $TextFile"
  exit 2
}

$text = [System.IO.File]::ReadAllText($TextFile)
if ([string]::IsNullOrWhiteSpace($text)) {
  Write-Error "Metin boş."
  exit 3
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$selected = "varsayılan"
$turkish = $null
foreach ($v in $synth.GetInstalledVoices()) {
  if ($v.Enabled -and $v.VoiceInfo.Culture.Name -like "tr*") { $turkish = $v; break }
}
if ($turkish -ne $null) {
  $synth.SelectVoice($turkish.VoiceInfo.Name)
  $selected = $turkish.VoiceInfo.Name
}

$synth.Rate = $Rate
$synth.SetOutputToWaveFile($Out)
$synth.Speak($text)
$synth.Dispose()

if (-not (Test-Path -LiteralPath $Out)) {
  Write-Error "WAV üretilemedi."
  exit 4
}

Write-Output "SAPI sesi: $selected"
