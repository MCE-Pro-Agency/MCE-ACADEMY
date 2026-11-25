# MCE Academy V6 : installation additive, avec sauvegarde et sans modification Supabase.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\LENOVO\MCE-ACADEMY'
$sourceComponent = Join-Path $PSScriptRoot '..\frontend\src\components\LearnerTabsCardV6.jsx'
$targetComponent = Join-Path $root 'frontend\src\components\LearnerTabsCardV6.jsx'
$targetPage = Join-Path $root 'frontend\src\pages\shared\ProfilsSuivi.jsx'
if (!(Test-Path $sourceComponent)) { throw 'Le fichier LearnerTabsCardV6.jsx manque dans le ZIP extrait.' }
if (!(Test-Path $targetPage)) { throw "ProfilsSuivi.jsx introuvable : $targetPage" }
$page = [IO.File]::ReadAllText($targetPage)
$import = "import LearnerTabsCardV6 from '../../components/LearnerTabsCardV6';"
$anchor = '<div className="space-y-8">'
if (!$page.Contains('export default function ProfilsSuivi') -or (!$page.Contains($anchor) -and !$page.Contains('LearnerTabControlsV6'))) {
  throw 'Structure de ProfilsSuivi.jsx non reconnue. Aucune modification faite.'
}
$backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item $targetPage "$targetPage.bak-v6-$backupStamp"
if (Test-Path $targetComponent) { Copy-Item $targetComponent "$targetComponent.bak-v6-$backupStamp" }
if ([IO.Path]::GetFullPath($sourceComponent) -ne [IO.Path]::GetFullPath($targetComponent)) { Copy-Item $sourceComponent $targetComponent -Force }

# Retire seulement l'ancienne V6 non branchÃ©e, si elle avait Ã©tÃ© installÃ©e.
$legacyImport = "import LearnerTabControlsV6 from './LearnerTabControlsV6';"
$page = $page.Replace($legacyImport + "`r`n", '').Replace($legacyImport + "`n", '')
$page = $page.Replace("{scope === 'trainer' && <LearnerTabControlsV6 />}", '')
if (!$page.Contains($import)) { $page = $import + "`n" + $page }
$node = "{(scope === 'trainer' ? activeCompanyId : companyFilter) && <LearnerTabsCardV6 companyId={scope === 'trainer' ? activeCompanyId : companyFilter} />}"
if (!$page.Contains('companyId={scope ===')) {
  if (!$page.Contains($anchor)) { throw 'Point d insertion V6 introuvable. Sauvegarde effectuee ; verifiez le fichier.' }
  $page = $page.Replace($anchor, $anchor + "`n      " + $node)
}
[IO.File]::WriteAllText($targetPage, $page, [Text.UTF8Encoding]::new($false))
Write-Host 'V6 installee : panneau actif et relie a companies.learner_tabs.' -ForegroundColor Green
Write-Host 'Aucune migration SQL effectuee.' -ForegroundColor Cyan
Write-Host "Sauvegarde : $targetPage.bak-v6-$backupStamp"
Write-Host 'Etape suivante : npm --prefix frontend run build' -ForegroundColor Cyan
