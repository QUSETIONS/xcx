# Quiet Atelier 消息与关系模块视觉 QA

## Source visual truth

- Source visual: `/Users/zhang/.codex/generated_images/01a04e8c-0924-7f62-9da3-2682749cffa3/exec-a2bf9a7a-31dc-4780-9cff-6addb78bb329.png`
- Intended CSS viewport: 390 x 844 mobile content area.
- Source pixels: 853 x 1844 PNG；按约 2.19x 视觉稿密度理解，比较时以 390 x 844 内容比例为准。
- Selected direction: porcelain seal, paper-white space, muted olive/wine typography, one clear primary action.

## Implementation evidence

- Implementation URLs: `http://localhost:8080/#/`, `http://localhost:8080/#/pages/message/index`, `http://localhost:8080/#/pages/network/friends`, `http://localhost:8080/#/pages/chat/index`.
- Browser capture: Codex in-app browser tab 2, with screenshots emitted inline for the home, message center, relationship management, support chat and direct-chat states; the active browser surface does not expose persisted screenshot file paths.
- Browser viewport: 1280 x 720 capture with the app's 720px H5 shell centered; this is a desktop-shell capture of the same mobile-first content, not a device-frame capture.
- State: local demo session over an isolated database; message center empty state; relationship page with a recent direct conversation and no accepted friends; direct chat with the provisioned AI test team; support chat with one user message and one service reply.
- Primary interactions tested: “开始写需求” opened `/pages/agent/index`; message tabs rendered; relationship page's recent conversation opened direct chat; direct chat sent a message and rendered it on the right with a visible user avatar; browser navigation returned without overflow.
- Runtime evidence: H5 build, typecheck and 520 frontend tests passed; no runtime error was visible in the captured states.

## Comparison

### Full-view comparison evidence

The implementation preserves the selected composition at the product level: a quiet paper surface, restrained masthead, serif hierarchy, wine-red actions, muted olive summary surfaces, ledger-like separators, and a direct input path. The same system now carries into the message center, relationship management and chat instead of switching back to the former blue/gradient UI.

### Focused region comparison evidence

- Hero visual: the generated porcelain-and-champagne seal is placed as a real image asset rather than recreated with CSS; `aspectFit` keeps the complete object visible in the H5 shell.
- Primary action: the hero CTA remains compact for the existing home hierarchy, while the brief launcher exposes a full-width “开始写需求” action matching the selected direction's clear conversion path.
- Input area: the launcher now follows “primary action → divider → direct input → secondary action”, matching the selected visual's pacing and keeping the textarea inside the viewport.
- Navigation: the existing five-item tab bar remains intentionally unchanged because it is product infrastructure, while the home content above it follows the selected visual language.
- Message center: the header, action desk, tabs, icon boxes and empty state use one paper/ink/wine rhythm; wide action labels are constrained so narrow screens can shrink safely.
- Relationship management: the summary metrics, tab strip, recent conversation row, person rows and empty action now share the same muted olive, champagne and wine tokens; fallback avatars use real text initials rather than decorative CSS shapes.
- Direct chat: service messages stay left with their avatar, user messages stay right with their avatar, and both bubble/attachment widths are capped with `min-width: 0` and `overflow-wrap: anywhere`.

## Findings

- No actionable P0/P1/P2 visual issues found in the captured state.
- [P3] The active H5 shell capture is 720px wide rather than the source's 390px mobile viewport; the source and implementation share the same mobile-first layout rules, but an exact device-size capture should be added when the browser surface exposes viewport control.
- [P3] The isolated database has no accepted friend records, so the relationship page uses the empty management state while still showing a real recent conversation; populated request rows should receive one final content-density review when production-like fixtures are available.

## Comparison history

1. Initial implementation used `aspectFill` for the new seal asset; the top of the object was cropped in the H5 preview.
2. Fixed the hero asset to `aspectFit`, recaptured the page, and verified the full seal and pedestal remain visible without horizontal overflow.
3. Started the real backend against an isolated temporary database, recaptured the home in the loaded state, and verified the primary CTA route and browser-back behavior.
4. Added resilient `avatar`/`avatar_url` handling and corrected the user-avatar foreground color; direct-chat capture confirmed the avatar is visible and the user message is right-aligned.
5. Reworked message, relationship and chat surfaces to the Quiet Atelier tokens; captures confirmed no centered message column or visible horizontal overflow.

## Implementation checklist

- [x] Add the selected porcelain seal asset.
- [x] Keep existing business routes and tab navigation intact.
- [x] Align hero copy, CTA, metrics and input launcher to the selected visual direction.
- [x] Verify no visible horizontal overflow in the H5 shell.
- [x] Verify the primary CTA reaches the Agent conversation.
- [x] Verify message center, relationship management and direct chat in the local browser.
- [x] Verify fallback and real-avatar states, including right-side user messages.
- [x] Verify action colors and avatar fallback do not fall back to the legacy blue/gradient treatment.
- [x] Run frontend tests, typecheck and H5 build.

## Follow-up polish

- Capture an exact 390 x 844 browser viewport when the active browser surface supports viewport overrides.
- If the live catalog is populated, review the first opportunity row and banner imagery against the same paper/porcelain art direction.

## Final result: passed
