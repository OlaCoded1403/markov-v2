# Generates a rough voiceover from voiceover.md using the Windows speech engine.
#
# This is a PROOFING tool, not the final audio. The built-in voices are robotic next to
# CapCut's. Use it to check pacing, catch words the engine mangles, and confirm the script
# fits the footage — then regenerate the real audio in CapCut from the same text.
#
#   powershell -ExecutionPolicy Bypass -File submission\make-voiceover.ps1

Add-Type -AssemblyName System.Speech

$OutDir = Join-Path $PSScriptRoot "voiceover-audio"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$VoiceName = "Microsoft David Desktop"
$Rate = -1   # -10..10; slightly under default for narration

$segments = [ordered]@{}

$segments["01-no-prompt-here"] = @'
This is my portfolio site. Live on Render, and nothing to do with AI memory. There is no memory prompt anywhere in this repository. It lives in a different folder entirely, and both tools load it by reference. Watch what the agent already knows.
'@

$segments["02-it-already-remembers"] = @'
I ask what it knows. It goes out to Walrus, finds a registry entry, resolves the project name to a slug, and returns four facts a session wrote last night. Including that my production hostname is quietly duplicated across four different files.
Then it checks whether any state was saved. None was. And it does not take that at face value. It runs a restore to confirm the records genuinely are not there, rather than telling me my history is gone when it might only be unindexed.
'@

$segments["03-real-work"] = @'
Now real work. Two parts of this site render the same data differently. The admin page escapes it. The public page does not. I ask what would actually break.
It finds five unescaped fields, and which ones are exploitable. I decide to leave it, because I am the only author of that data, and I set the condition that would change my mind. That decision is what I want to survive.
'@

$segments["04-handoff"] = @'
I type handoff. It writes what it learned to Walrus, then a checkpoint: the goal, what was done, what comes next, and the decision with its reasoning. It returns blob I Ds as receipts.
Look at the last line. Supersedes, none. The first checkpoint this project has ever had.
'@

$segments["05-walruscan"] = @'
Here is that blob on the Walrus explorer. Sui mainnet. Encrypted, permanent, and anyone can open it without my credentials. This is not a database sitting on my laptop.
'@

$segments["06-antigravity"] = @'
Now a different tool entirely. Antigravity, Google's command line agent. Different vendor, different model, no access to the conversation I just closed. It loads the same prompt from that other folder.
I ask where we left off on Vibez Protocol. It opens with goal, done, next and blockers, naming the checkpoint written minutes ago inside another company's product.
'@

$segments["07-how-did-you-choose"] = @'
But resuming could just be luck. So I ask it how it chose.
It says retrieval here is semantic, not chronological, and that recency is invisible to similarity ranking. So it recalled the entire set with a limit of one hundred, checked the returned count against that limit to be certain nothing had been truncated, parsed the timestamp out of every record, and sorted them itself.
That is the bug I found in the original prompt, and the fix for it, described back to me by a model that has never seen my conversation.
'@

$segments["08-close"] = @'
Markov v2. The prompt, the setup guide, and the harness that measured the original failure are all in the repository.
'@

function New-Clip {
    param([string]$Text, [string]$Path, [string]$Voice)
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    try {
        $synth.SelectVoice($Voice)
        $synth.Rate = $Rate
        $synth.SetOutputToWaveFile($Path)
        $synth.Speak($Text)
    }
    finally {
        $synth.Dispose()
    }
}

function Get-WavSeconds {
    param([string]$Path)
    # RIFF/WAVE: byte rate at offset 28, data size in the chunk after "data".
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $byteRate = [BitConverter]::ToUInt32($bytes, 28)
    if ($byteRate -eq 0) { return 0 }
    return [math]::Round(($bytes.Length - 44) / $byteRate, 1)
}

$total = 0.0
$full = New-Object System.Text.StringBuilder

Write-Output "voice: $VoiceName   rate: $Rate"
Write-Output ""

foreach ($name in $segments.Keys) {
    $text = ($segments[$name] -replace "\s+", " ").Trim()
    $path = Join-Path $OutDir "$name.wav"
    New-Clip -Text $text -Path $path -Voice $VoiceName
    $secs = Get-WavSeconds -Path $path
    $total += $secs
    $words = ($text -split "\s+").Count
    Write-Output ("  {0,-26} {1,5}s  {2,4} words" -f $name, $secs, $words)
    [void]$full.Append($text).Append(" ")
}

$fullPath = Join-Path $OutDir "00-full-voiceover.wav"
New-Clip -Text $full.ToString() -Path $fullPath -Voice $VoiceName
$fullSecs = Get-WavSeconds -Path $fullPath

Write-Output ""
Write-Output ("  segments total   {0}s  ({1:N1} min)" -f [math]::Round($total,1), ($total/60))
Write-Output ("  single file      {0}s  -> {1}" -f $fullSecs, $fullPath)

# A short comparison clip in the other installed voice.
New-Clip -Text (($segments["07-how-did-you-choose"] -replace "\s+", " ").Trim()) `
         -Path (Join-Path $OutDir "sample-zira-segment07.wav") -Voice "Microsoft Zira Desktop"
Write-Output "  comparison       sample-zira-segment07.wav (female voice, same text)"
