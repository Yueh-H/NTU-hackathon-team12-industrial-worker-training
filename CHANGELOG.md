# Changelog

## [0.11.2] - 2026-08-16

### Removed
- Full manufacturing-sheet rasters and the pet atlas from GitHub (`drawing.png`, `drawing-sm.png`, `alis-pet.webp`)

## [0.11.1] - 2026-08-16

### Removed
- Identifying names and titles from training cards, seed copy, and deck notes

## [0.11.0] - 2026-08-16

### Changed
- Learning and work-order data stay in the browser; Firebase is switched off
- GitHub Pages no longer injects Firebase web keys
- Firestore and Storage rules now deny all access until Auth exists

## [0.10.4] - 2026-08-16

### Changed
- Work-order pages no longer embed or preview a PDF unless the user opens the file link

## [0.10.3] - 2026-08-16

### Removed
- Published PDFs from GitHub Pages (`demo-sheet.pdf` and the model sheet)

## [0.10.2] - 2026-08-15

### Added
- Ranking page now shows the current 100-point scoring breakdown

## [0.10.1] - 2026-08-15

### Added
- Supervisor home embeds the DEMO-001 model PDF at the top of the page

## [0.10.0] - 2026-08-15

### Added
- Redacted FM-DEMO / DEMO-001 PDF is shipped on GitHub Pages
- Built-in demo work order so the sheet can be shown remotely without uploading again

## [0.9.0] - 2026-08-15

### Added
- Home gate now has two entries: employee page and boss page
- Boss-uploaded work orders appear on the worker rail and learn home

### Changed
- Today's review, already-learned, and ranking sit in one row on the worker path

## [0.8.0] - 2026-08-15

### Added
- Boss work-order upload on the home gate, supervisor overview, and `/admin/workorders`
- PDF/PNG dropzone that creates employee learning units from the uploaded sheet

## [0.7.1] - 2026-08-15

### Changed
- Path and materials +/− each toggle on their own; opening one no longer closes the others

## [0.7.0] - 2026-08-15

### Added
- Chinese and Indonesian shown together on worker, quiz, ranking, and supervisor chrome

## [0.6.2] - 2026-08-15

### Changed
- Quiz no longer requires finishing Chinese speech first; speech still awards 1 star

## [0.6.1] - 2026-08-15

### Added
- Standalone model-sheet Level 1 trainer under `model_sheet_training_v0_7_components/`

## [0.6.0] - 2026-08-15

### Added
- Supervisor card editor so each card can be edited on its own

## [0.5.0] - 2026-08-15

### Added
- Per-card stars: speech gives 1 star, a correct quiz gives 2 stars
- Unit banners turn to 2 stars when every card in that unit is answered correctly

### Changed
- All six learning units stay open; later units are no longer locked

## [0.4.0] - 2026-08-15

### Added
- Review folder for cards learned once, grouped and colored by D+1 / D+3 / D+7 / D+30
- Early review from the folder so a later quiz can advance the next milestone without moving later dates

## [0.3.1] - 2026-08-15

### Fixed
- Browser tab titles now match the page: 主管檢核, 員工學習, 全員排行榜

## [0.3.0] - 2026-08-15

### Added
- Ranking entry on the worker path and work-order rail, with a back link to the same learner

## [0.2.0] - 2026-08-15

### Added
- Supervisor review sidebar with a people list and an all-hands overview
- Team mastery heatmap so one screen shows every worker and every card
- Per-person admin detail grouped by card category

## [0.1.0] - 2026-08-15

### Added
- Initial hackathon app: worker learning path and supervisor table
