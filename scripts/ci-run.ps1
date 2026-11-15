# CI yardımcı betiği: bir komutu çalıştırır, çıktısını akıtır ve başarısız olursa
# çıktının son kısmını ::error:: olarak yayınlar. Günlük indirmeye erişim olmayan
# durumlarda hatanın sebebini GitHub "annotation" API'sinden okumayı sağlar.
#
#   pwsh scripts/ci-run.ps1 npm run smoke
#   pwsh scripts/ci-run.ps1 -Label "Masaüstü derleme" npm run build:desktop
param(
  [string]$Label = "",
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$Command
)

$ErrorActionPreference = "Continue"
if (-not $Command -or $Command.Count -eq 0) {
  Write-Output "::error title=ci-run::Komut verilmedi"
  exit 2
}

$exe = $Command[0]
$argList = @()
if ($Command.Count -gt 1) { $argList = $Command[1..($Command.Count - 1)] }
if (-not $Label) { $Label = ($Command -join " ") }

$collected = New-Object System.Collections.Generic.List[string]
$sw = [System.Diagnostics.Stopwatch]::StartNew()

& $exe @argList 2>&1 | ForEach-Object {
  $line = [string]$_
  Write-Output $line
  $collected.Add($line)
}
$code = $LASTEXITCODE
$sw.Stop()

if ($code -ne 0) {
  # Not: GitHub, ::error:: mesajını ~4000 karakterde kesiyor ve BAŞTAN kesiyor;
  # bu yüzden yalnızca son satırları gönderiyoruz ki gerçek hata görünsün.
  $tail = ($collected | Select-Object -Last 25) -join " ⏎ "
  if ($tail.Length -gt 3500) { $tail = $tail.Substring($tail.Length - 3500) }
  if ($tail.Length -eq 0) { $tail = "(çıktı yok)" }
  Write-Output "::error title=$Label başarısız (çıkış kodu $code, $([math]::Round($sw.Elapsed.TotalSeconds,1)) sn)::$tail"
  exit $code
}

Write-Output "ci-run: $Label tamam ($([math]::Round($sw.Elapsed.TotalSeconds,1)) sn)"
exit 0
