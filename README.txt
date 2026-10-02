TEST COPY (your original project is untouched)

vercel_test/
  public/index.html   -> patched frontend (+ sitemap.xml, robots.txt, logo.png unchanged)
  api/tts.js          -> serverless version of your Express TTS route

Run locally:
  1. npm i -g vercel
  2. cd vercel_test
  3. create a file named .env with:
       AZURE_SPEECH_KEY=your_key
       AZURE_SPEECH_REGION=your_region
  4. vercel dev
  5. open http://localhost:3000 and test the Listen button

Changes vs your original:
  - index.html: fetch('/') -> fetch('/api/tts')
  - index.html: BOUNDARY now includes "/" and "-"
  - index.html: OVERRIDES has brihaspati, brihattar, brihat (बृहत्), brihad (बृहद्)
  - sitemap.xml / robots.txt / og tags still point to the old Azure URL: update before going live
