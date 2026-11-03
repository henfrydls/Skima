# Writes the Partner Center identity into the manifest text and returns it.
# Used by msix.yml for a Store build, and self-tested there with fake values on every run.
#
# Checks the exact attributes, case-sensitively: the manifest's comments also say
# "placeholder", so a loose case-insensitive search for the word always failed.
param(
  [Parameter(Mandatory)][string]$Manifest,
  [AllowEmptyString()][string]$Name,
  [AllowEmptyString()][string]$Publisher,
  [AllowEmptyString()][string]$DisplayName
)
$ErrorActionPreference = 'Stop'

$values = [ordered]@{
  MSIX_IDENTITY_NAME          = $Name
  MSIX_PUBLISHER              = $Publisher
  MSIX_PUBLISHER_DISPLAY_NAME = $DisplayName
}
foreach ($key in $values.Keys) {
  if ([string]::IsNullOrWhiteSpace($values[$key])) { throw "repository variable $key is empty" }
}

$swaps = @(
  @('Name="Placeholder.Skima"', "Name=`"$Name`""),
  @('Publisher="CN=00000000-0000-0000-0000-000000000000"', "Publisher=`"$Publisher`""),
  @('<PublisherDisplayName>Placeholder Publisher</PublisherDisplayName>', "<PublisherDisplayName>$DisplayName</PublisherDisplayName>")
)
foreach ($swap in $swaps) {
  # String.Contains and String.Replace are ordinal: case-sensitive and exact.
  if (-not $Manifest.Contains($swap[0])) { throw "the manifest has no $($swap[0]) to replace" }
  $Manifest = $Manifest.Replace($swap[0], $swap[1])
}
foreach ($swap in $swaps) {
  if ($Manifest.Contains($swap[0])) { throw "the Store build still carries $($swap[0])" }
  if (-not $Manifest.Contains($swap[1])) { throw 'the Store identity was not applied' }
}
$Manifest
