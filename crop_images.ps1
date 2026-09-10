Add-Type -AssemblyName System.Drawing
$src = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)

# Ensure assets dir
$destDir = "C:\Users\hemab\OneDrive\Desktop\Electrike\electrike\assets\images"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

# 1. Inner illustration crop: X=95, Y=400, W=834, H=392
$rectInner = New-Object System.Drawing.Rectangle(95, 400, 834, 392)
$cropInner = $bmp.Clone($rectInner, $bmp.PixelFormat)
$cropInner.Save("$destDir\sustainability_illustration.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropInner.Dispose()

# 2. Card crop: X=45, Y=310, W=934, H=485
$rectCard = New-Object System.Drawing.Rectangle(45, 310, 934, 485)
$cropCard = $bmp.Clone($rectCard, $bmp.PixelFormat)
$cropCard.Save("$destDir\sustainability_card.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropCard.Dispose()

$bmp.Dispose()
Write-Host "Crops saved successfully."
