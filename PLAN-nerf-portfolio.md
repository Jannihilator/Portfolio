# Plan: Nerf-gun toy portfolio (desktop draft)

Branch: `splash-redesign`. Build target: PC web only for the draft. Phone support later.

## Core idea
Core value (from the blog post): **make something fun to play with first.** The toy is a nerf-gun cursor. The **sideways, snap-scrolling project carousel is the main focus**; the toy lives around it and never covers or gates it.

## Locked decisions
- Carousel scrolls **sideways with snap**. Each featured project is one slide with its thinking process (beats).
- Featured case studies, 5 slides: **Star Fishing, Borderless** (beats already in `projects.js`), then **Camp Movewell** (`renushu`), **XHaler** (`xhaler`), **Wool You Mask It** (`wool-you-mask-it`). The user writes the real beats for the last three; build them with clearly marked placeholder beats in the same shape as `star-fishing.beats`.
- Below or beside the carousel: an **"Other projects" section** with smaller thumbnails for the rest (Serainity, jams, past projects, prototypes), reusing the `projects.js` groups and media.
- Look: **stylized 3D tabletop diorama**, soft toy-like **wooden props**, with **cardboard-cutout paper layers** for pages. The assistant makes the art (procedural or generated, no external art needed).
- Tech: libraries allowed. Suggested: **three.js** for the diorama and **matter.js** or a small custom solver for darts and props. Vanilla JS with ES modules, no framework needed. Pin exact versions, load from cdnjs or jsdelivr.
- Retire the LED wall (`led-wall.js`, `led-wall.css`, `led-wall.config.js`). Keep `projects.js` data. Leave `.cursor/rules/portfolio-guidelines.mdc` and `.claude/` alone.

## Guardrails
1. The carousel is readable and fully usable with **no shooting at all**. The toy never hides text or media.
2. **No rules for the visitor to fiddle with:** no ammo count, score, reload, settings, or modes. Fire rate is limited only by the gun's own animation.
3. Surprising uses must be emergent from simple physics, not scripted tutorials.
4. Everything must be **diegetic to the playground/toy-table theme** (foam darts, wood props, paper cutouts).
5. Darts must also work on **buttons**, and every button must still work with a plain click, keyboard, and focus (accessibility).
6. Respect `prefers-reduced-motion`.

## Toy behaviour
- **Cursor:** nerf-gun aim over the scene. Swap to a normal pointer over text inputs, links and the carousel controls, or keep the crosshair clearly visible there. Never hide the cursor where it makes usage unclear.
- **Fire:** click shoots a foam dart on a short arc with recoil. Gun flash and a soft foam *pop*.
- **Dart sticks** where it lands (like a suction dart) on paper layers, the carousel's target-board frame, props. It stays there and can be knocked off by another hit.
- **Holes:** darts punch holes only in the **decorative paper layers** (backdrop, slide margins, the cover). They never go through text or media. **Holes heal** (decided): the paper slowly mends itself.
- **Knock down props (decided):** the scene is built from **wooden blocks, block-built castle buildings, and trees**. All of them can be shot and **topple over** with rigid-body physics (stacked blocks collapse, towers fall, trees tip). Castles are made of individual blocks so they fall apart realistically. Props near the carousel must not fall onto or cover it.
- **Hit buttons:** a dart landing on a button triggers it (carousel arrows, "other projects", contact). Visual feedback is a press-in.
- **Echo of the old LED wall:** a dart landing is something the scene reacts to, like the snake food. Idea: a small toy critter wanders toward stuck darts. Keep it as an optional flourish.
- **Surprise uses (let them emerge from the block physics):** a toppling tower knocks over the next one, a falling block presses a button, darts stick on blocks and trees, a tree falling into a castle wall. No scripted extras beyond blocks, castles and trees.
- **Fallen props:** toppled pieces stay where they land; they don't respawn on their own, and a gentle reset (for example after a reload) is the only way back. No reset button, to avoid adding a rule.

## Phases
1. **Scaffold:** new entry page and module structure. Static diorama scene plus the carousel with snap, no toy. Use real Star Fishing and Borderless beats. Build the placeholder slides.
2. **Toy core:** cursor, firing, dart flight, sticking, recoil, sound. No holes yet.
3. **Interactions:** holes in paper layers, prop physics, button hits, accessibility fallbacks.
4. **Other projects section** with thumbnails from `projects.js`.
5. **Polish:** art pass, juice, performance, retire LED wall files, reduced-motion.
6. **Fill beats:** the user replaces placeholders for Camp Movewell, XHaler, Wool You Mask It.

## Done means (draft)
- The cursor is a nerf-gun aim and a click fires a dart.
- A dart can punch a hole in a paper layer, knock a prop down, and press a button.
- The carousel slides sideways with snap and shows each of the 5 projects' thinking process; scrolling reveals that every project has it.
- The visitor can ignore the toy and still read everything, and can use every button without shooting.
- The "other projects" thumbnails are visible without leaving the page.
- Runs smoothly on the user's PC (target 60 fps on a normal desktop browser). No console errors.
- Verified in the browser with real interaction (shoot, hole, knock, button), not just by reading code.

## Open items for the builder
- Decided: holes heal; props are blocks, block-built castles and trees, all shootable and topple-able.
- Still open: how long holes take to heal, and whether fallen blocks should ever tidy themselves up.
- Confirm sound: foam *pop* and soft thunks are in; music is out.
- Ask the user before changing the theme (the user picks the theme).
