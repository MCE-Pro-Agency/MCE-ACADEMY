# MCE Academy V6 : deplace le panneau vers un 7e onglet Formateur.
# Depuis la racine C:\Users\LENOVO\MCE-ACADEMY :
# powershell -ExecutionPolicy Bypass -File .\scripts\installer_V6_MENU.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$appFile = Join-Path $root 'frontend\src\App.jsx'
$menuFile = Join-Path $root 'frontend\src\components\layout\AppLayout.jsx'
$profileFile = Join-Path $root 'frontend\src\pages\shared\ProfilsSuivi.jsx'
$pageFile = Join-Path $root 'frontend\src\pages\trainer\AccessManagement.jsx'
$cardFile = Join-Path $root 'frontend\src\components\LearnerTabsCardV6.jsx'
foreach ($file in @($appFile, $menuFile, $profileFile, $pageFile, $cardFile)) {
  if (!(Test-Path $file)) { throw "Fichier manquant : $file. Copiez d'abord les dossiers frontend et scripts du ZIP dans le projet." }
}
$app = [IO.File]::ReadAllText($appFile)
$menu = [IO.File]::ReadAllText($menuFile)
$profiles = [IO.File]::ReadAllText($profileFile)

# Controles AVANT tout changement : eviter les remplacements dangereux.
$importAnchor = "import TrainerReports from './pages/trainer/Reports';"
$routeAnchor = '<Route path="/formateur/rapports" element={<TrainerReports />} />'
$navAnchor = "{ to: '/formateur/rapports', label: 'Résultats & rapports', icon: Award },"
if (!$app.Contains('AccessManagement') -and (!$app.Contains($importAnchor) -or !$app.Contains($routeAnchor))) {
  throw 'App.jsx ne correspond pas a la V4/V5 attendue : aucune modification effectuee.'
}
if (!$menu.Contains("'/formateur/acces'") -and !$menu.Contains($navAnchor)) {
  throw 'AppLayout.jsx ne correspond pas a la V4/V5 attendue : aucune modification effectuee.'
}

# Suppression de l'ancienne insertion V6 dans ProfilsSuivi (sans toucher au contenu de la page).
$profiles = $profiles.Replace("import LearnerTabsCardV6 from '../../components/LearnerTabsCardV6';`r`n", '')
$profiles = $profiles.Replace("import LearnerTabsCardV6 from '../../components/LearnerTabsCardV6';`n", '')
$profiles = $profiles.Replace("{(scope === 'trainer' ? activeCompanyId : companyFilter) && <LearnerTabsCardV6 companyId={scope === 'trainer' ? activeCompanyId : companyFilter} />}", '')

if (!$app.Contains("import AccessManagement from './pages/trainer/AccessManagement';")) {
  $app = $app.Replace($importAnchor, $importAnchor + "`n" + "import AccessManagement from './pages/trainer/AccessManagement';")
}
if (!$app.Contains('path="/formateur/acces"')) {
  $app = $app.Replace($routeAnchor, $routeAnchor + "`n          " + '<Route path="/formateur/acces" element={<AccessManagement />} />')
}
if (!$menu.Contains("'/formateur/acces'")) {
  $menu = $menu.Replace($navAnchor, $navAnchor + "`n      " + "{ to: '/formateur/acces', label: 'Gestion des accès', icon: LockKeyhole },")
}
if (!$menu.Contains('CalendarClock, LockKeyhole,')) {
  $menu = $menu.Replace('CalendarClock,', 'CalendarClock, LockKeyhole,')
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($file in @($appFile, $menuFile, $profileFile)) {
  Copy-Item $file "$file.bak-v6-menu-$stamp" -Force
}
[IO.File]::WriteAllText($appFile, $app, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText($menuFile, $menu, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText($profileFile, $profiles, [Text.UTF8Encoding]::new($false))

Write-Host 'V6 corrigee : Gestion des acces = 7e onglet du menu Formateur.' -ForegroundColor Green
Write-Host 'Panneau V6 retire de Profils professionnels. V4/V5 conservees.' -ForegroundColor Green
Write-Host "Sauvegardes : .bak-v6-menu-$stamp" -ForegroundColor Cyan
Write-Host 'Verification : npm --prefix .\frontend run build' -ForegroundColor Cyan
Write-Host 'Aucun SQL execute et aucun push Git effectue.' -ForegroundColor Cyan
