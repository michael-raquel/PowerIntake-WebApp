Teams app package notes

1) Create an icons folder: teams/icons
2) Copy these files into it:
   - public/icons/icon-192x192.png -> teams/icons/color.png
   - public/icons/favicon-32x32.png -> teams/icons/outline.png

3) Update teams/manifest.json if needed:
   - id: use the Teams app ID you want to submit
   - contentUrl + websiteUrl: use your production URL
   - validDomains: include only the domains you will use

4) Zip the contents of teams/ (manifest.json + icons/)
5) Upload the zip to the Teams Developer Portal and submit to the Store
