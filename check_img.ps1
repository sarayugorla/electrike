Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$img = [System.Drawing.Image]::FromFile($imgPath)
Write-Host "Width: $($img.Width), Height: $($img.Height)"
$img.Dispose()
