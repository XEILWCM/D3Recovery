# D3Recovery project page

Project website for *Inter-crystal scatter recovery of a light-sharing depth-encoding Prism-PET prototype scanner using a diffusion model* (Medical Physics 2026, SNMMI 2026 oral presentation).

The site is plain HTML, CSS and JavaScript with no build step, so GitHub Pages can serve this folder as is.

## Publish on GitHub Pages

The page is set up to live in the XEIL organization on GitHub, [XEILWCM](https://github.com/XEILWCM), at `https://xeilwcm.github.io/D3Recovery/`.

1. Sign in to GitHub with an account that can create repositories in XEILWCM, either an organization owner or a member allowed to create repositories.
2. Create a new **public** repository owned by XEILWCM and name it `D3Recovery`. Leave it empty, with no README, license or `.gitignore`.
3. Push the contents of this `website` folder to it. From a terminal inside this folder

   ```bash
   git init
   git add .
   git commit -m "D3Recovery project page"
   git branch -M main
   git remote add origin https://github.com/XEILWCM/D3Recovery.git
   git push -u origin main
   ```

   `.gitignore` keeps macOS folder files and the old slide viewer leftovers (`static/slides/`, `static/js/slides.js`, the slides PDF and `jinyi-qi.jpg`) out of the push. GitHub Desktop works too. So does the web uploader (Add file → Upload files), since every file is under its 25 MB limit, but Finder hides `.nojekyll` and `.gitignore`, so delete those leftovers from the folder before uploading and add `.nojekyll` afterwards with Add file → Create new file, leaving it empty.
4. In the repository go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. A minute or two later the page is live at `https://xeilwcm.github.io/D3Recovery/`. The Actions tab shows the deployment.

If Settings → Pages refuses to publish, an organization owner can allow it under Organization settings → Member privileges → Pages creation.

If you name the repository something other than `D3Recovery`, the address changes with it, so update the `og:url` and `og:image` lines near the top of `index.html` to match. They make link previews on Slack, X and LinkedIn show the preview image.

### Private or public

On GitHub's free plan a Pages site needs a public repository, and the site is public too. Publishing from a private repository needs a paid organization plan (GitHub Team or GitHub Enterprise Cloud), and only Enterprise Cloud can limit who may open the site.

For a quiet launch from a public repository, add `<meta name="robots" content="noindex">` inside `<head>` in `index.html` so search engines skip the page, and remove it when you announce it.

## Videos and captions

The one-minute overview under the TL;DR is the narrated LinkedIn launch video. Its captions are part of the picture, so it has no caption file.

The Full video presentation section plays our SNMMI 2026 oral presentation from `static/videos/`, with the captions in a bar beneath the video. The picture is the deck exported from PowerPoint, so the fonts, Morph transitions and builds are sharp, and every slide change sits on the matching word of the narration.

| File | Contents |
| --- | --- |
| `static/videos/D3Recovery_overview.mp4` | The one-minute overview, H.264 at 1920 × 1080 with AAC audio |
| `static/images/overview_poster.webp` | Title frame shown before the overview starts |
| `static/videos/D3Recovery_talk.mp4` | The talk, H.264 at 1920 × 1080 with AAC audio, ready for streaming |
| `static/videos/D3Recovery_talk.vtt` | The captions (WebVTT). Words wrapped in `<b>` show in the highlight color |
| `static/images/talk_poster.webp` | Title slide shown before the video starts |

To fix a caption, edit its text in the `.vtt` file and leave the time line above it as it is. The CC button in the bar hides the captions, and in full screen the browser draws the same captions on the video.

## Author photos

The title block shows a circular photo for each author except Jinyi Qi, whose circle shows his initials. The files live in `static/images/authors/` as 224 × 224 px JPGs.

| Author | File | Source |
| --- | --- | --- |
| Wanbin Tan | `wanbin-tan.jpg` | Goldan lab page |
| Saurav Dosi | `saurav-dosi.jpg` | LinkedIn |
| Soroush Shabani Sichani | `soroush-shabani-sichani.jpg` | Goldan lab page |
| Yixin Li | `yixin-li.jpg` | LinkedIn |
| Zipai Wang | `zipai-wang.jpg` | LinkedIn |
| Eric Petersen | `eric-petersen.jpg` | LinkedIn |
| Xinjie Zeng | `xinjie-zeng.jpg` | LinkedIn |
| Jinyi Qi | No photo, initials only | |
| Amir H. Goldan | `amir-goldan.jpg` | Goldan lab page |

To swap a photo, save a square image over the file with the same name (JPG, 400 × 400 px or larger, face centered). The page crops it to a circle, so no code changes are needed. If a file goes missing, the initials show instead.

## What is in here

| Path | Contents |
| --- | --- |
| `index.html` | The page |
| `static/css/style.css` | Styles |
| `static/js/main.js` | Comparison sliders, talk video captions, Stage 1 and Stage 2 viewers, BibTeX copy, figure zoom |
| `static/js/arch.js` | Animated walkthrough on the architecture figure. The arrow routes and highlight boxes are pixel positions on `fig4_architecture.webp`, so update them if you replace that image |
| `static/js/data.js` | Data for the two interactive viewers, read from the model outputs shown in the SNMMI 2026 slides |
| `static/images/` | Paper figures, slider crops in `compare/`, author photos in `authors/`, video posters, social preview image, favicons |
| `static/videos/` | Overview video, talk video and the talk captions |
| `static/files/` | The BibTeX file |
| `.gitignore` | Keeps macOS folder files and leftovers from the old slide viewer out of the repository |

## Editing notes

- Author names and photos link to the ORCID profiles listed in the paper, or to an institutional page for the three authors without an ORCID there. Saurav Dosi's name and photo link to sauravdosi.com instead. Swap in other personal pages if you prefer.
- To preview locally, run `python3 -m http.server` in this folder and open `http://localhost:8000`. That server cannot stream video in pieces, so jumping ahead in the talk video waits for the download. GitHub Pages streams it.
- Figures and the abstract come from the published article (© 2026 AAPM). The footer says so.
