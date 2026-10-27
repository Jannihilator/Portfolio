/**
 * Portfolio projects, ported from the previous site's cards + modals.
 * Clicking a card swaps to the info view in the same panel.
 */
window.PORTFOLIO_PROJECTS = [
  {
    id: "recent",
    title: "Notable Projects",
    layout: "stack",
    projects: [
      {
        id: "star-fishing",
        title: "Star Fishing (In Development)",
        status: "Solo project, in development",
        size: "big",
        media: [
          { type: "image", src: "./assets/star-fishing.png", alt: "Star Fishing" },
          { type: "video", src: "./assets/Shooting_Star_Medias/demo.mp4" },
        ],
        description:
          "A game about fishing for shooting stars and collecting constellations.",
        stack: ["Shader", "Upgrade / Ability System", "Skill Tree"],
        beats: [
          {
            heading: "Bringing the sky to life",
            blocks: [
              {
                type: "text",
                text: "I started with the sky. Adding foreground water, fog and reflection to bring it to life.",
              },
              {
                type: "row",
                cols: 3,
                items: [
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/just_sky.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/just_sky.jpg",
                    caption: "Sky only",
                    note: "Flat sky with no focal point.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/water_no_fog.mp4",
                    caption: "Water shader",
                    note: "Adding foreground water shader with waves and glints.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/fog_reflection.mp4",
                    caption: "Fog and reflection",
                    note: "The cut looks fake, adding fog and a blurred edge blend sky and water.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Stars you can catch",
            blocks: [
              {
                type: "text",
                text: "I made the first stars with a particle system, however colliders on particles are bot the best way to tell if you hit one, so each star became a prefab with a trail and its own particles. I also wanted an avatar for the player to project their actions into the game for better immersiveness, so I added a fishing boat to the foreground.",
              },
              {
                type: "row",
                cols: 2,
                items: [
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/prefab.mp4",
                    caption: "Prefab",
                    note: "A collider on a particle is a bad hit test, so each star is a prefab with a trail and its own particles.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/fishing_particles.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/fishing_particles.jpg",
                    caption: "Boat",
                    note: "A boat as a focal point. However the shooting stars lies distant in the background layer.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Casting the line",
            blocks: [
              {
                type: "text",
                text: "Using 2D stars as the interactable layer, it offers clarity and allows for different rarity and looks. Which will be used as our main progression of the game to collect rare stars and complete constellation. In addition, I don't want catching to be too easy, so the spin aims on a timed click and the line flings out along the tangent. Problem is you end up staring at the spin instead of the sky, so I changed it to a mouse drag and swing making the rod cast out and waits until a star is close, fully portrays the star fishing fantasy.",
              },
              {
                type: "row",
                cols: 2,
                items: [
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/spin_cast.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/spin_cast.png",
                    caption: "Spin cast",
                    note: "A timed click flings the line along the tangent. Harder on purpose, so windup, homing, and guiding lines fit, but you stop watching the sky.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/lay_cast.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/lay_cast.png",
                    caption: "Swing cast",
                    note: "You swing the mouse out and the rod waits until a star is close. Closer to real fishing, where you sit and wait.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "borderless",
        title: "Borderless",
        size: "big",
        media: [
          { type: "image", src: "./assets/Borderless_Medias/web/people-work-together.jpg", alt: "Four people around a table playing Borderless on their phones" },
          { type: "video", src: "./assets/borderless-website.mp4" },
        ],
        description:
          "Innovating a new medium across 4 mobile phones by creating a 20-minute, cooperative puzzle-narrative seamlessly integrating film narrative, game design, and comic art storytelling.",
        stack: ["Unity", "Custom UDP/TCP Sockets", "Android Input System"],
        team: "2 programmers, 2 artists, 1 producer, 1 writer",
        role: "Programmer, networking",
        duties: "Original concept, prototyping, performance optimization",
        timeline: "Jan–May 2026",
        href: "https://projects.etc.cmu.edu/big-picture-studio/",
        iframe: "https://www.youtube.com/embed/ulOF7EMQaaA?si=Ya-9DIRYZQONljsz",
        devlog: true,
        beats: [
          {
            heading: "Animation that ignores the bezel",
            blocks: [
              {
                type: "text",
                text: "I once played Zoom, an improv game where a sequence of pictures is revealed side by side, each one zooming out from the last. I thought it would be cool if those pictures lived on several shared devices and could come to life, with animation flowing from one screen into the next as if the borders were not there.",
              },
              {
                type: "row",
                match: "height",
                items: [
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/zoom.jpg",
                    alt: "Picture cards from the improv game Zoom laid out side by side",
                    ratio: "1100 / 256",
                    caption: "Zoom",
                    note: "What if these pictures lived on several shared devices and could come to life?",
                  },
                ],
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/ok-go.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/ok-go.jpg",
                    caption: "OK Go",
                    note: "An OK Go music video played across a wall of phones. Many screens can act as one picture.",
                  },
                ],
              },
              {
                type: "text",
                text: "We chose phones as the screens. Everyone already has one, they come with the touch and motion sensors we needed, and a group waiting in a queue can put theirs together and play.",
              },
            ],
          },
          {
            heading: "Where is each phone?",
            blocks: [
              {
                type: "text",
                text: "For a picture to line up across screens, every phone has to know where it sits relative to the others. I went through earlier multi-display research to see how others solved it.",
              },
              {
                type: "row",
                width: "narrow",
                items: [
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/research-paper-cases.jpg",
                    alt: "Pages from a multi-display research paper showing phones and tablets arranged into one large picture",
                    ratio: "auto",
                    caption: "Free-shape multi-display",
                    note: "Separate displays arranged freely read as one large image, and can fit spaces a single screen cannot.",
                  },
                ],
              },
              {
                type: "row",
                match: "height",
                items: [
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/fiducial.png",
                    alt: "Diagram of two tablets locating each other through a fiducial marker",
                    ratio: "383 / 403",
                    caption: "Fiducial marker",
                    note: "Each phone camera finds a marker and works out its own pose. It needs extra setup, and the camera angle is constrained.",
                  },
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/pinch.png",
                    alt: "Diagram of a pinch gesture across two phones telling them which edges meet",
                    ratio: "740 / 449",
                    caption: "Pinch across two screens",
                    note: "The player pinches across two phones. The direction on each screen tells them which edges meet. No setup needed, so this became our baseline.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Proof of concept",
            blocks: [
              {
                type: "text",
                text: "Before there was a game, I built quick proofs of concept to show the team what I had in mind: pinch two screens to join them, then let content cross the seam.",
              },
              {
                type: "row",
                cols: 2,
                ratio: "9 / 16",
                width: "narrow",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/jigsaw-connect.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/jigsaw-connect.jpg",
                    caption: "Jigsaw connect",
                    note: "A pinch across two tablets registers them as neighbors.",
                  },
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/animation-connect.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/animation-connect.jpg",
                    caption: "Animation connect",
                    note: "Once joined, the picture continues from one screen onto the other.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Four phones on one PC",
            blocks: [
              {
                type: "text",
                text: "Testing every idea on four real phones is slow, so we built a simulator. Each window is a phone, and moving windows next to each other stands in for placing phones side by side.",
              },
              {
                type: "row",
                cols: 2,
                ratio: "3 / 2",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/pc-jigsaw.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/pc-jigsaw.jpg",
                    caption: "Jigsaw",
                    note: "Phones as puzzle pieces. Arrange the windows until the picture lines up.",
                  },
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/pc-polygon.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/pc-polygon.jpg",
                    caption: "Polygon",
                    note: "A more dynamic idea, where the outcome is generated in real time as lines carry across windows.",
                  },
                ],
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/player-polygon.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/player-polygon.jpg",
                    caption: "Polygon on real phones",
                    note: "A player building the shape across four phones.",
                  },
                ],
              },
            ],
          },
          {
            heading: "The eye catches a late frame",
            blocks: [
              {
                type: "text",
                text: "Everything rests on pinch detection. Both touched phones have to register the gesture at a precise moment so the network can update every screen together.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/static-animation.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/static-animation.jpg",
                    caption: "Forgiving case",
                    note: "Mostly static background with one moving subject. If the sync is a little off, nobody notices.",
                  },
                ],
              },
              {
                type: "callout",
                label: "Problem",
                text: "When the whole picture flows across the border, a lag in detection is obvious. Human eyes are very sensitive to a line that breaks at the seam.",
              },
              {
                type: "text",
                text: "I logged the timestamp each phone attached to the same pinch and subtracted them. The gap was seconds, not milliseconds: the phones' system clocks disagree.",
              },
            ],
          },
          {
            heading: "Play on the host's clock",
            blocks: [
              {
                type: "text",
                text: "Every phone syncs its time to the host. When a pinch comes in, the host does not say \"play now\". It works out a lookahead and schedules the start.",
              },
              {
                type: "flow",
                steps: [
                  { actor: "Phones", title: "Sync clocks", text: "Each phone learns its offset from the host clock." },
                  { actor: "Phones", title: "Pinch", text: "Both touched phones report the gesture." },
                  { actor: "Host", title: "Schedule", text: "Broadcast: play at host time now + 100 ms." },
                  { actor: "Phones", title: "Convert", text: "Each phone maps that time onto its own clock." },
                  { actor: "Result", title: "Play", text: "Every screen starts on the same frame." },
                ],
              },
              {
                type: "row",
                cols: 2,
                ratio: "5 / 4",
                arrow: true,
                items: [
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/log-before.jpg",
                    alt: "Android logcat before the fix, with time differences of several seconds",
                    caption: "Log before",
                    stat: "7.8 s average gap",
                    note: "TIME DIFF for one pinch ran from 3,894 ms to 16,303 ms.",
                  },
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/log-after.jpg",
                    alt: "Android logcat after the fix, with time differences under 50 milliseconds",
                    caption: "Log after",
                    stat: "19.6 ms average gap",
                    note: "TIME DIFF from 0 to 50 ms once the start is scheduled on the host clock.",
                  },
                ],
              },
              {
                type: "row",
                cols: 2,
                ratio: "9 / 10",
                arrow: true,
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/before-sync.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/before-sync.jpg",
                    caption: "Before sync",
                    note: "A composite animation across four phones. Each screen starts at a different time, so the borders visibly mismatch.",
                  },
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/after-sync.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/after-sync.jpg",
                    caption: "After sync",
                    note: "The same animation after the fix. The picture runs across the borders smoothly.",
                  },
                ],
              },
            ],
          },
          {
            heading: "A ripple for every pinch",
            blocks: [
              {
                type: "text",
                text: "I made a shader effect inspired by liquid glass for the pinch gesture. Every connection ripples along the joined edge, so each change feels fluid and players can see it coming.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/ripple-shader.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/ripple-shader.jpg",
                    caption: "Ripple shader",
                    note: "The ripple travels along the edge where two phones meet.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Pieces, displays and controllers",
            blocks: [
              {
                type: "text",
                text: "With that in place, phones work as puzzle pieces, as displays and as controllers at the same time, for a group of players working together.",
              },
              {
                type: "row",
                match: "height",
                items: [
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/spaceship.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/spaceship.jpg",
                    ratio: "2 / 3",
                    caption: "Displays",
                    note: "One scene spread across every screen on the table.",
                  },
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/interacting-with-4-phones.jpg",
                    alt: "Players pinching across four phones laid out on a table",
                    ratio: "4 / 3",
                    caption: "Puzzle pieces",
                    note: "Players pinch phones together to join them into one picture.",
                  },
                ],
              },
              {
                type: "row",
                match: "height",
                items: [
                  {
                    type: "image",
                    src: "./assets/Borderless_Medias/web/people-work-together.jpg",
                    alt: "Four people around a table playing Borderless on their phones",
                    ratio: "768 / 429",
                    caption: "Together",
                    note: "A group playtest around one table.",
                  },
                  {
                    type: "video",
                    src: "./assets/Borderless_Medias/web/controller.mp4",
                    poster: "./assets/Borderless_Medias/web/posters/controller.jpg",
                    ratio: "16 / 9",
                    caption: "Controllers",
                    note: "Some phones show the scene while others act as controllers.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "renushu",
        title: "Camp Movewell",
        size: "big",
        media: [
          { type: "image", src: "./assets/renushu-game.png", alt: "Camp Movewell gameplay" },
          { type: "image", src: "./assets/renushu-pt.jpeg", alt: "Camp Movewell physical therapy" },
          {
            type: "image",
            src: "./assets/g4c.jpeg",
            alt: "The Camp Movewell team at the 2026 Games for Change Awards",
            detailOnly: true,
          },
          {
            type: "image",
            src: "./assets/Camp_Movewell_Medias/extra-zoom-some-James2.jpeg",
            alt: "James on stage presenting the Camp Movewell smart shoes",
            detailOnly: true,
          },
        ],
        description:
          "Camp Movewell, from the ReNUSHU team at CMU’s Entertainment Technology Center with Magnes AG, is an exergame that makes physical therapy fun and measurable with NuShu smart shoes for gait sensing and haptic feedback. From rehab to play, from play to progress, every step is progress you can see and measure.",
        stack: ["Unity", "Magnes NuShu Smart Shoes", "UDP/TCP Sockets", "JavaScript"],
        team: "2 programmers, 2 artists, 1 producer",
        role: "Programmer, gameplay & web",
        duties: "Game design, prototyping, web interface",
        timeline: "Aug–Dec 2025",
        href: "https://projects.etc.cmu.edu/renushu/",
        iframe: "https://www.youtube.com/embed/Ba08R8ydzJk?si=unLnzsuObv6Sbwyk",
        // PLACEHOLDER beats: same shape as star-fishing. Replace the text
        // and media with the real thinking process, then drop `placeholder`.
        placeholder: true,
        beats: [
          {
            heading: "Placeholder: where it started",
            blocks: [
              {
                type: "text",
                text: "Placeholder beat. What problem the physical therapists had, and the first idea for the smart shoes.",
              },
              {
                type: "row",
                cols: 2,
                items: [
                  {
                    type: "image",
                    src: "./assets/renushu-pt.jpeg",
                    alt: "Camp Movewell physical therapy session",
                    caption: "Placeholder caption",
                    note: "Placeholder note about this step.",
                  },
                  {
                    type: "image",
                    src: "./assets/renushu-game.png",
                    alt: "Camp Movewell gameplay",
                    caption: "Placeholder caption",
                    note: "Placeholder note about this step.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Placeholder: what changed",
            blocks: [
              {
                type: "text",
                text: "Placeholder beat. A problem found in playtests and how the design changed because of it.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "image",
                    src: "./assets/g4c.jpeg",
                    alt: "The Camp Movewell team at the 2026 Games for Change Awards",
                    caption: "Placeholder caption",
                    note: "Placeholder note about this step.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "xhaler",
        title: "XHaler",
        size: "big",
        media: [
          { type: "image", src: "./assets/Xhaler_Media/web/posters/demo-reel.jpg", alt: "XHaler demo reel" },
          { type: "video", src: "./assets/Xhaler_Media/web/demo-reel.mp4", fallback: "./assets/Xhaler_Media/web/flowers.jpg" },
        ],
        description:
          "A VR game with multiple levels, played by breathing. The goal is to experiment with this new type of control and see whether it can reach a higher state of immersion, including emotional impact.",
        stack: ["Unity", "Meta Quest 3", "Python", "Sensor Integration"],
        team: "2 programmers, 2 artists, 1 level designer",
        role: "Programmer, sensors & hardware",
        duties: "Prototyping, sensor integration",
        timeline: "Jan–May 2025",
        href: "https://projects.etc.cmu.edu/xhaler/about-us/",
        beats: [
          {
            heading: "A VR game played with your breath",
            blocks: [
              {
                type: "text",
                text: "XHaler is a VR game with multiple levels, and the goal is to experiment with a new type of control: your breathing. We chose VR in the first place because it already brings immersion, so the question is whether breath can lift that higher, emotional impact included.",
              },
              {
                type: "row",
                cols: 2,
                ratio: "16 / 9",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/fire-credits.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/fire-credits.jpg",
                    caption: "Breathing fire",
                    note: "The credits scene, with the wind sensor driving the fire.",
                  },
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/gdc.jpg",
                    alt: "A player in a headset at the XHaler booth on the GDC show floor",
                    caption: "At GDC",
                    note: "We brought the game to the community.",
                  },
                ],
              },
            ],
          },
          {
            heading: "A breathing pattern becomes an ability",
            blocks: [
              {
                type: "text",
                text: "The project started from a fantasy: use breathing as a game input. Our early vision was that when your input matches a specific breathing pattern, an ability triggers. A steady breath shoots a steady arrow, and a stable pattern summons a shield.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/media-1.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/media-1.jpg",
                    ratio: "1920 / 576",
                    caption: "Steady arrow",
                    note: "Matching the pattern shoots a steady arrow.",
                  },
                ],
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/media-2.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/media-2.jpg",
                    ratio: "1920 / 576",
                    caption: "Shield",
                    note: "A stable pattern summons a shield.",
                  },
                ],
              },
              {
                type: "text",
                text: "These are not edited mockups. That is me using a sensor I built by hand, composited with concept footage. A stretchy band changes resistance as the chest expands, and an Arduino reads it.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/stack.png",
                    alt: "Early tech stack diagram: Arduino with a microphone, wind sensor, conducting cord or flex sensor, feeding Unity on a Meta Quest 3",
                    ratio: "auto",
                    caption: "Early tech stack",
                    note: "Arduino reads the sensors and sends the breath to Unity on the headset.",
                  },
                ],
              },
            ],
          },
          {
            heading: "First interaction: inhale to puff up",
            blocks: [
              {
                type: "text",
                text: "The first thing I built with the breathing input was a Flappy Bird style game. Inhaling puffs the fish up and makes it rise, and exhaling shrinks it so it sinks. The size of the fish becomes another layer on top of the height, yet it feels intuitive because it matches what the body does.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/flappy-bird-prototype.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/flappy-bird-prototype.jpg",
                    ratio: "1304 / 720",
                    caption: "Flappy fish prototype",
                  },
                ],
              },
              {
                type: "callout",
                label: "Caution",
                text: "When the game demands precise control, players may hyperventilate. The rest of the game has to be designed with that in mind.",
              },
            ],
          },
          {
            heading: "One breathing pattern per level",
            blocks: [
              {
                type: "text",
                text: "The core of the game is a set of levels, each using a different breathing pattern, to see whether that boosts immersion on top of VR. Here are some of the patterns and the scenarios we imagined, like diving in water, sneaking past guards and blowing on pinwheels.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/plan.jpg",
                    alt: "Level plan: each level labelled with a hand-drawn breathing pattern, including Intro, Sneak, Blow Fans, Run, Heal, Dive, Climb, Archery and Dragon fire",
                    ratio: "auto",
                    caption: "Level plan",
                    note: "Each level is tied to a pattern drawn on a sticky note.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Reading everyone's breath",
            blocks: [
              {
                type: "text",
                text: "To make detection accessible, the data needs processing. Everyone breathes differently, some through the chest and others with the belly, and the values vary too. This is the pipeline I built:",
              },
              {
                type: "flow",
                cols: 2,
                steps: [
                  { actor: "Signal", title: "Smooth", text: "A low-pass filter or short moving average removes sensor noise." },
                  { actor: "Signal", title: "Slope", text: "The first derivative over a short window. Positive is inhaling, negative is exhaling, near zero is holding." },
                  { actor: "Signal", title: "Hysteresis", text: "A minimum-duration rule so noise does not flip the state every few frames." },
                  { actor: "Player", title: "Calibrate", text: "A short calibration records the player's min and max chest expansion, since amplitude varies by person and strap tightness." },
                ],
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/calibration.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/calibration.jpg",
                    caption: "Calibration",
                    note: "The player's breathing range is measured before play.",
                  },
                ],
              },
              {
                type: "text",
                text: "With that in place we made the archery demo: hold your breath and it generates a power shot arrow.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/archery-hold.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/archery-hold.jpg",
                    caption: "Hold to power shot",
                    note: "Holding your breath generates a power shot arrow.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Feedback you can see",
            blocks: [
              {
                type: "text",
                text: "Even while you are just breathing and moving around the map, the environment picks up your breathing state and reflects it as diegetic feedback. The same goes for diving, where the bubbles react to your breath.",
              },
              {
                type: "row",
                cols: 2,
                ratio: "16 / 9",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/synced-vfx-vine.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/synced-vfx-vine.jpg",
                    caption: "Environment follows you",
                    note: "The vines reflect the player's breathing state.",
                  },
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/dive-bubbles.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/dive-bubbles.jpg",
                    caption: "Diving",
                    note: "The bubbles react to your breathing.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Measuring the air itself",
            blocks: [
              {
                type: "text",
                text: "A strap is good at telling inhale, exhale or hold, but it knows less about how much air comes out of the player's mouth. So we added a wind sensor to the headset and moved to an ESP32 for a more compact controller board. Now we can detect any exhale and also measure the throughput of the wind, then map it to the game.",
              },
              {
                type: "row",
                match: "height",
                items: [
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/wind-sensor-hmd.jpg",
                    alt: "A wind sensor mounted on a VR headset",
                    ratio: "1081 / 898",
                    caption: "Wind sensor on the headset",
                  },
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/sensor.jpg",
                    alt: "An ESP32 board, a Vernier respiration belt and a bare wind sensor board on a desk",
                    ratio: "4 / 3",
                    caption: "ESP32, respiration belt and wind sensor",
                  },
                ],
              },
              {
                type: "row",
                items: [
                  {
                    type: "video",
                    src: "./assets/Xhaler_Media/web/wind-sensor.mp4",
                    poster: "./assets/Xhaler_Media/web/posters/wind-sensor.jpg",
                    ratio: "16 / 9",
                    caption: "Wind as input",
                    note: "The throughput of the wind is mapped to the game.",
                  },
                ],
              },
            ],
          },
          {
            heading: "What I learned",
            blocks: [
              {
                type: "text",
                text: "The way players interact with the game is likely not the way you designed it, unless you design the experience carefully. Because the body is the input, intuitiveness really matters, or the game causes body dissonance. Feedback matters just as much: it tells the player the state of the game and encourages them to keep going when things go well.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/blockers.jpg",
                    alt: "Process diagram: initial design, prototype, encounter blockers, then refine and add enhancers such as positive reinforcement, diegetic feedback, simple, intuitive and one focus",
                    ratio: "auto",
                    caption: "Blockers and enhancers",
                  },
                ],
              },
              {
                type: "row",
                width: "narrow",
                items: [
                  {
                    type: "image",
                    src: "./assets/Xhaler_Media/web/lawrence-shooting.jpg",
                    alt: "A player enjoying the game in a headset",
                    ratio: "auto",
                    caption: "The design intention only reaches the players once all the blockers are removed.",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "jams",
    title: "Game Jams",
    layout: "grid",
    projects: [
      {
        id: "wool-you-mask-it",
        title: "Wool You Mask It",
        media: [{ type: "image", src: "./assets/sheep.png", alt: "Wool You Mask It" }],
        description:
          'A Global Game Jam 2026 submission for the theme "Mask". Programmed organic herding animal behaviors with state machine. Implemented special mask abilities that cross influence the animals.',
        stack: ["Unity", "Local Multiplayer", "Animal AI"],
        iframe: "https://www.youtube.com/embed/h6fDWDABDJI?si=jGGutDBmGCm1bqKO",
        // PLACEHOLDER beats: replace with the real thinking process.
        placeholder: true,
        beats: [
          {
            heading: "Placeholder: herding that feels alive",
            blocks: [
              {
                type: "text",
                text: "Placeholder beat. How the sheep state machine moves between grazing, fleeing and flocking.",
              },
              {
                type: "row",
                items: [
                  {
                    type: "image",
                    src: "./assets/sheep.png",
                    alt: "Wool You Mask It",
                    caption: "Placeholder caption",
                    note: "Placeholder note about this step.",
                  },
                ],
              },
            ],
          },
          {
            heading: "Placeholder: masks that change the flock",
            blocks: [
              {
                type: "text",
                text: "Placeholder beat. How each mask ability pushes on the animals, and what came out of playtesting it in the jam.",
              },
            ],
          },
        ],
      },
      {
        id: "voice-in-the-void",
        title: "Voice in the Void",
        media: [{ type: "image", src: "./assets/void.png", alt: "Voice in the Void" }],
        description:
          'A thatgamecompany × COREBLAZER GAME JAM 2025 submission for the theme "Gererousity," created in two days. It\'s a chat-based game where players show generosity to aliens whose encrypted messages gradually become clearer, eventually receiving gifts that decorate their home planets as symbols of connection.',
        stack: ["Unity", "Open AI api"],
        href: "https://yenchun.itch.io/voice-in-the-void",
      },
      {
        id: "moustache-twins",
        title: "Moustache Twins",
        media: [{ type: "image", src: "./assets/twin.png", alt: "Moustache Twins" }],
        description:
          'A Garena Game Jam 2025 submission for the theme "Super Hero," created in two days. It\'s a cooperative arcade game that challange the player to coordinate with each other while dodging cheetos and saving people.',
        stack: ["Unity", "Online Leaderboard"],
        href: "https://loyiwu.itch.io/moustache-twins",
      },
      {
        id: "mento-issue",
        title: "Mento-Issue",
        media: [
          { type: "image", src: "./assets/mento.png", alt: "Mento-Issue" },
          { type: "video", src: "./assets/MentoIssueDemo.mp4" },
        ],
        description:
          'A Global Game Jam 2025 submission for the theme "Bubble," created in two days. It\'s a puzzle platformer with 10 levels, where players use Mentos and soda bottles to strategically elevate themselves. The game won the Pittsburgh site non-traditional award for its creative approach.',
        stack: ["Unity", "Level Design"],
        href: "https://yenchun.itch.io/mento-issue",
      },
      {
        id: "no-sight-all-might",
        title: "No Sight All Might",
        media: [{ type: "image", src: "./assets/nosight.png", alt: "No Sight All Might" }],
        description:
          'A 1-bit Jam 2024 submission for the theme "Light and Dark." Players control a ball while dodging enemies. The twist is that players can only attack enemies when they’re out of sight, requiring them to anticipate movements and track them in the dark.',
        stack: ["Unity", "Skill System", "Boss Fight"],
        href: "https://yenchun.itch.io/no-sight-all-might",
      },
      {
        id: "reefenge",
        title: "Reefenge",
        media: [{ type: "image", src: "./assets/reefenge.png", alt: "Reefenge" }],
        description:
          'A game for GMTK Game Jam 2023 titled "Roles-Reverse." In this bullet hell game, players control the enemy ships instead of the player, with the goal of eliminating the player\'s ship as quickly as possible. Resource management and strategic troop deployment are key.',
        stack: ["Unity"],
        href: "https://yenchun.itch.io/reefenge",
      },
    ],
  },
  {
    id: "past",
    title: "Past Projects",
    layout: "grid",
    projects: [
      {
        id: "serainity",
        title: "Serainity",
        size: "big",
        media: [
          { type: "image", src: "./assets/rain-to-serene.png", alt: "Serainity" },
          { type: "video", src: "./assets/rain-demo.mp4" },
        ],
        description:
          "A serene incremental game where rain falls on lily pads to earn drops, spent on expanding the pond through two distinct upgrade paths across rain and sunny phases. Every ephemeral element (raindrops, ripple effects, leaf splashes, water beads, floating score popups, frogs) runs through object pools to keep low memory allocations. The water surface is a custom shader driven by a ping-pong render texture wave simulation, while each lily pad carries unique procedurally-assigned shader properties.",
        stack: ["Shader", "Object Pooling"],
        iframe:
          "https://drive.google.com/file/d/1Udm21wbATYzfJfTBL4Q8_MjhB9S8pgze/preview",
      },
      {
        id: "gpt-battle",
        title: "GPT Battle",
        media: [{ type: "image", src: "./assets/gpt.png", alt: "GPT Battle" }],
        description:
          "A 2v2 wizard spell battle where spells are created by shouting them out loud. The microphone transcribes the voice, and ChatGPT interprets it through carefully designed rules to offer a corresponding spell.",
        stack: ["Unity", "Shader", "VFX Graph"],
        iframe:
          "https://drive.google.com/file/d/180ETl7H-uREpvFuKvvtqr6q_F-UW0wGZ/preview",
      },
      {
        id: "keep-your-head-up",
        title: "Keep Your Head Up",
        media: [{ type: "image", src: "./assets/snowman.png", alt: "Keep Your Head Up" }],
        description:
          "Using two 3D Rudders as input, where both players put there feet on the rudders. One player controling the head's movement while the other is tilting the entire map. Chaotic fun between players and the environment.",
        stack: ["Unity", "3D Rudder"],
        iframe:
          "https://drive.google.com/file/d/1FJYkTiRtiy5pZPC0bid_faIG67U2nox1/preview",
      },
      {
        id: "bar-vr",
        title: "Bar VR",
        media: [{ type: "image", src: "./assets/bar.png", alt: "Bar VR" }],
        description:
          "A VR bar fighting experience where player engages in a card game followed by throwing and dodging glass bottles. Customized hand grabbing and throwing to bypass hardware limitations.",
        stack: ["Unity", "VR", "Hand Gesture"],
        iframe:
          "https://drive.google.com/file/d/1u-qRbpnzGRsChvOJRoRvUrrPOzW0WTQQ/preview",
      },
      {
        id: "meow-spa",
        title: "Meow Spa",
        media: [{ type: "image", src: "./assets/cat.png", alt: "Meow Spa" }],
        description:
          "A two player game using buttons to control the conveyor belt and the machines. The game is desinged to challange coordination between players by putting the correct washing procedure on cats.",
        stack: ["Unity", "Adaptive Controllers"],
        iframe:
          "https://drive.google.com/file/d/1Kq54EDSm5exo5r31GHUDo-qaoCR2mZXG/preview",
      },
      {
        id: "qduel",
        title: "Q*duel",
        media: [{ type: "image", src: "./assets/qduel.png", alt: "Q*duel" }],
        description:
          "Inspired by the arcade game Q*bert, this game turns the classic into a local two player area control challange. Color the cube to your color to win, and watch out for the environment!",
        stack: ["Unity", "Enemy AI", "Vocal SFX"],
        href: "https://yenchun.itch.io/qduel",
      },
      {
        id: "virtual-gallery",
        title: "3D Virtual Gallery",
        media: [{ type: "image", src: "./assets/gallery.png", alt: "3D Virtual Gallery" }],
        description:
          "An online gallery showcasing past student works of Prof. Ei Jane Janet Lin. Explored various possibility of how art can be presented in a digital way. Implemented interesting mechanism where visitors can interact with art or the gallery itself, such as painting on the wall, taking the travelator, etc.",
        stack: ["JavaScript", "3D", "HTML/CSS"],
        href: "https://jannihilator.github.io/Virtual-Gallery/",
        iframe:
          "https://drive.google.com/file/d/1VmaGXVE7c82ZA8KSUYO9l4r9jqV6ZxNV/preview",
      },
      {
        id: "hand-motion",
        title: "Hand Motion",
        media: [{ type: "image", src: "./assets/hand.png", alt: "Hand Motion Recognition" }],
        description:
          "A hand motion recognition tool using MediaPipe's solution. It not only recognizes static gestures but also movements. Users will be able to browse through web pages by scrolling with their hand mid air, reducing human contact during epidemic times. Later transformed into a game of shooting faces.",
        stack: ["Python", "MediaPipe", "Raspberry Pi"],
        iframe:
          "https://drive.google.com/file/d/1WYP1o24g-h2uRECVJx0-WsvQZa_qck2g/preview",
      },
      {
        id: "duel-zone",
        title: "Duel zone",
        media: [{ type: "image", src: "./assets/duelzone.png", alt: "Duel zone" }],
        description:
          "Duel zone is a two player card and area control game. Players manage their action cards to play them in the most efficient sequence. Win by either claim the most territory, develop techs or simply knock the opponent out. The game is about strategizing and anticipating moves of your opponent.",
        stack: ["Board Game", "Paper Prototype"],
        href: "./assets/duelzone.pdf",
      },
    ],
  },
  {
    id: "prototypes",
    title: "Prototypes",
    layout: "grid",
    projects: [
      {
        id: "pencil-shoot",
        title: "Pencil Shoot",
        media: [{ type: "image", src: "./assets/pencil.png", alt: "Pencil Shoot" }],
        description: "",
        stack: ["Unity", "Tile Map"],
      },
      {
        id: "slash-moji",
        title: "Slash-Moji",
        media: [{ type: "image", src: "./assets/dash.png", alt: "Slash-Moji" }],
        description: "",
        stack: ["Unity", "2D Destruction"],
      },
      {
        id: "ghost-hunt",
        title: "Ghost Hunt",
        media: [{ type: "image", src: "./assets/ghost.png", alt: "Ghost Hunt" }],
        description: "",
        stack: ["Unity", "Networking"],
      },
    ],
  },
];

(function (projects) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findProject(id) {
    for (const section of projects) {
      const match = section.projects.find((p) => p.id === id);
      if (match) return match;
    }
    return null;
  }

  function cardItems(project) {
    return (project.media || []).filter((item) => !item.detailOnly);
  }

  function featuredMedia(project) {
    const items = cardItems(project);
    const video = items.find((item) => item.type === "video");
    return video ? [video] : items;
  }

  /** Wide cards show still and clip together. A grid card stays on the still. */
  function cardMedia(project) {
    const items = cardItems(project);
    if (project.size === "big") return items;
    const stills = items.filter((item) => item.type !== "video");
    return stills.length ? stills : items;
  }

  /** "16 / 9" or a number, as width over height. 0 when it is not a ratio. */
  function ratioValue(ratio) {
    if (typeof ratio === "number") return ratio > 0 ? ratio : 0;
    const [w, h] = String(ratio || "").split("/").map(Number);
    return w > 0 && h > 0 ? w / h : 0;
  }

  function passCaption(block) {
    return block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
  }

  function passNote(block) {
    const stat = block.stat ? `<p class="pass-stat">${escapeHtml(block.stat)}</p>` : "";
    const note = block.note ? `<p class="pass-note">${escapeHtml(block.note)}</p>` : "";
    return stat || note ? `<div class="pass-text">${stat}${note}</div>` : "";
  }

  function passBox(media, block) {
    return `<div class="pass-box">${media}${passNote(block)}</div>`;
  }

  /** A "match" row sets each item's ratio, so the frame keeps that shape under cover. */
  function passShape(ratio) {
    if (ratio === "auto") return ` class="pass-natural"`;
    return ratioValue(ratio) ? ` style="aspect-ratio: ${escapeHtml(ratio)}"` : "";
  }

  function passItemHtml(block, ratio) {
    const shape = passShape(block.ratio || ratio);
    let media;
    if (block.type === "image") {
      media = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(
        block.alt || ""
      )}" loading="lazy" decoding="async"${shape} />`;
    } else {
      const poster = block.poster ? ` poster="${escapeHtml(block.poster)}"` : "";
      const fallback = block.fallback ? ` data-fallback="${escapeHtml(block.fallback)}"` : "";
      media = `<video class="beat-video" muted loop playsinline autoplay preload="metadata"${poster}${fallback}${shape} src="${escapeHtml(
        block.src
      )}"></video>`;
    }
    return `<figure class="pass">
      ${passCaption(block)}
      ${passBox(media, block)}
    </figure>`;
  }

  const ROW_ARROW = `<span class="pass-arrow" aria-hidden="true"></span>`;

  function rowHtml(block) {
    const items = block.items || [];
    const classes = ["pass-row"];
    let style = "";
    if (block.match === "height" || block.arrow) {
      const tracks = items.map((item) => {
        const fr = block.match === "height" ? ratioValue(item.ratio) || 1 : 1;
        return `minmax(0, ${fr.toFixed(3)}fr)`;
      });
      classes.push("pass-row--tracks");
      style = ` style="--row-tracks: ${tracks.join(block.arrow ? " auto " : " ")}"`;
    } else if (block.cols === 2 || block.cols === 3) {
      classes.push(`cols-${block.cols}`);
    }
    if (block.arrow) classes.push("pass-row--arrow");
    if (block.width === "narrow") classes.push("pass-row--narrow");
    const parts = items.map((item) => passItemHtml(item, block.ratio));
    return `<div class="${classes.join(" ")}"${style}>${parts.join(block.arrow ? ROW_ARROW : "")}</div>`;
  }

  function flowHtml(block) {
    const steps = (block.steps || [])
      .map(
        (step, i) => `<li class="beat-flow-step${step.actor === "Host" ? " is-host" : ""}">
          <span class="beat-flow-actor">${escapeHtml(step.actor || "")}</span>
          <strong><span class="beat-flow-num">${i + 1}</span>${escapeHtml(step.title || "")}</strong>
          <span class="beat-flow-text">${escapeHtml(step.text || "")}</span>
        </li>`
      )
      .join("");
    return `<ol class="beat-flow${block.cols === 2 ? " beat-flow--2" : ""}">${steps}</ol>`;
  }

  function beatBlockHtml(block) {
    if (block.type === "text") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "row") return rowHtml(block);
    if (block.type === "flow") return flowHtml(block);
    if (block.type === "callout") {
      const label = block.label ? `<span class="beat-callout-label">${escapeHtml(block.label)}</span>` : "";
      return `<div class="beat-callout">${label}<p>${escapeHtml(block.text || "")}</p></div>`;
    }
    return "";
  }

  /** A devlog entry folds down to its log number and heading. The first one starts open. */
  function logEntryHtml(beat, i) {
    const blocks = (beat.blocks || []).map(beatBlockHtml).join("");
    return `<details class="beat beat--log"${i === 0 ? " open" : ""}>
      <summary>
        <span class="beat-step">Log ${String(i + 1).padStart(2, "0")}</span>
        <h2>${escapeHtml(beat.heading || "")}</h2>
      </summary>
      <div class="beat-body">${blocks}</div>
    </details>`;
  }

  function beatsHtml(project) {
    if (!Array.isArray(project.beats) || !project.beats.length) return "";
    if (project.devlog) {
      return `<div class="beats beats--log">${project.beats.map(logEntryHtml).join("")}</div>`;
    }
    return project.beats
      .map((beat) => {
        const heading = beat.heading ? `<h2>${escapeHtml(beat.heading)}</h2>` : "";
        const blocks = (beat.blocks || []).map(beatBlockHtml).join("");
        return `<section class="beat">${heading}${blocks}</section>`;
      })
      .join("");
  }

  /** Loops the passes you can see. Offscreen clips stay paused, and a
   *  reduced-motion setting leaves them stopped with controls. */
  let beatObserver = null;

  const STALL_MS = 8000;

  /** A clip that has shown nothing after a while swaps its poster for its
   *  fallback still, so a slow connection does not leave a dead frame. */
  function watchStall(video) {
    const fallback = video.dataset.fallback;
    if (!fallback || video.dataset.watching) return;
    video.dataset.watching = "1";
    const stalled = () => video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA;
    const timer = setTimeout(() => {
      if (stalled()) video.setAttribute("poster", fallback);
    }, STALL_MS);
    video.addEventListener("loadeddata", () => clearTimeout(timer), { once: true });
    video.addEventListener(
      "error",
      () => {
        clearTimeout(timer);
        video.setAttribute("poster", fallback);
      },
      { once: true }
    );
  }

  function bindBeatPlayers(root) {
    if (beatObserver) {
      beatObserver.disconnect();
      beatObserver = null;
    }
    const videos = [...root.querySelectorAll("video.beat-video")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      videos.forEach((video) => {
        video.removeAttribute("autoplay");
        video.controls = true;
        video.pause();
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      videos.forEach((video) => {
        watchStall(video);
        video.play().catch(() => {});
      });
      return;
    }
    beatObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            watchStall(video);
            video.play().catch(() => {});
          } else video.pause();
        });
      },
      { threshold: 0.35 }
    );
    videos.forEach((video) => beatObserver.observe(video));
  }

  function detailPhotoHtml(project) {
    const photos = (project.media || []).filter((item) => item.detailOnly && item.type === "image");
    if (!photos.length) return "";
    const figures = photos
      .map(
        (item) => `<figure class="project-detail-photo">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || "")}" />
        </figure>`
      )
      .join("");
    return `<div class="project-detail-photos">${figures}</div>`;
  }

  /**
   * Clips live under a hidden panel, so a <video> there does not download
   * until the panel opens. Fetch them during the wall instead, and point the
   * elements at those bytes.
   */
  const preloadedVideo = new Map();
  /** Original URL when the early fetch was skipped or failed, so the clip still plays. */
  const videoFallback = new Set();
  let preloadActive = true;
  /** Bytes in flight for the loading line. Each clip weighs the same, so one
   *  finished file is a quarter of the way whether it was the short one or not. */
  const videoLoads = new Map();

  function eachVideoSrc(visit) {
    const seen = new Set();
    for (const section of projects) {
      for (const project of section.projects) {
        for (const item of project.media || []) {
          if (item.type !== "video" || seen.has(item.src)) continue;
          seen.add(item.src);
          visit(item.src);
        }
      }
    }
  }

  function videoViewOpen(video) {
    const page = document.getElementById("page");
    if (!page || page.hidden) return false;
    const body = video.closest("[data-view]");
    return Boolean(body && !body.hidden);
  }

  function usePreloadedVideo(src, url) {
    document.querySelectorAll("video[data-video]").forEach((video) => {
      if (video.dataset.video !== src) return;
      const source = video.querySelector("source");
      if (!source || source.getAttribute("src") === url) return;
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;
      source.setAttribute("src", url);
      video.load();
      if (videoViewOpen(video)) video.play().catch(() => {});
    });
  }

  function keepNetworkSrc(src) {
    videoFallback.add(src);
    usePreloadedVideo(src, src);
  }

  function finishVideoLoad(src) {
    const slot = videoLoads.get(src);
    if (slot) slot.done = true;
  }

  /** 0 until the first byte, 1 when every clip has landed or been given up on. */
  function videoLoadProgress() {
    if (videoLoads.size === 0) return 1;
    let sum = 0;
    for (const item of videoLoads.values()) {
      if (item.done) sum += 1;
      else if (item.total > 0) sum += Math.min(1, item.loaded / item.total);
    }
    return sum / videoLoads.size;
  }

  async function readVideo(src, res) {
    if (!res.ok || !res.body || !res.body.getReader) {
      keepNetworkSrc(src);
      finishVideoLoad(src);
      return;
    }
    const slot = videoLoads.get(src);
    const total = Number(res.headers.get("content-length")) || 0;
    if (slot) slot.total = total;
    const reader = res.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      if (slot) slot.loaded += value.byteLength;
    }
    const blob = new Blob(chunks, { type: "video/mp4" });
    if (!blob.size) {
      keepNetworkSrc(src);
      finishVideoLoad(src);
      return;
    }
    const url = URL.createObjectURL(blob);
    preloadedVideo.set(src, url);
    usePreloadedVideo(src, url);
    if (slot && slot.total > 0) slot.loaded = slot.total;
    finishVideoLoad(src);
  }

  function preloadProjectVideos() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) {
      preloadActive = false;
      return;
    }
    eachVideoSrc((src) => {
      videoLoads.set(src, { loaded: 0, total: 0, done: false });
      fetch(src, { priority: "low" })
        .then((res) => readVideo(src, res))
        .catch(() => {
          keepNetworkSrc(src);
          finishVideoLoad(src);
        });
    });
  }

  function mediaHtml(items, extraClass, options) {
    if (!items || !items.length) return "";
    const bits = items
      .map((item) => {
        if (item.type === "video") {
          const autoplay = options && options.autoplay ? " autoplay" : "";
          let direct = preloadedVideo.get(item.src) || "";
          if (!direct && (!preloadActive || videoFallback.has(item.src))) direct = item.src;
          const srcAttr = direct ? ` src="${escapeHtml(direct)}"` : "";
          return `<video class="${extraClass}" muted loop playsinline preload="auto" data-video="${escapeHtml(
            item.src
          )}"${autoplay}>
            <source${srcAttr} data-src="${escapeHtml(item.src)}" type="video/mp4" />
          </video>`;
        }
        return `<img class="${extraClass}" src="${escapeHtml(item.src)}" alt="${escapeHtml(
          item.alt || ""
        )}" loading="lazy" decoding="async" />`;
      })
      .join("");
    return `<div class="project-card-media">${bits}</div>`;
  }

  function stackHtml(stack) {
    if (!stack || !stack.length) return "";
    return `<ul class="project-stack">${stack
      .map((tag) => `<li>${escapeHtml(tag)}</li>`)
      .join("")}</ul>`;
  }

  function contributionLines(project) {
    const data = window.PROJECT_CONTRIBUTIONS || {};
    const lines = data[project.id];
    if (!Array.isArray(lines)) return [];
    return lines.map((line) => String(line).trim()).filter(Boolean);
  }

  function cardLine(project) {
    const data = window.PROJECT_CONTRIBUTIONS || {};
    const award = (data.awards || {})[project.id];
    const tagline = (data.taglines || {})[project.id];
    return String(award || tagline || "").trim();
  }

  function awardHtml(project) {
    const line = cardLine(project);
    if (!line) return "";
    return `<p class="project-award">${escapeHtml(line)}</p>`;
  }

  function contributionsHtml(project) {
    const lines = contributionLines(project);
    if (!lines.length) return "";
    const data = window.PROJECT_CONTRIBUTIONS || {};
    const personal = Array.isArray(data.personal) ? data.personal : [];
    const label = personal.includes(project.id)
      ? data.personalLabel || "Highlights"
      : data.label || "My contributions";
    return `<div class="project-contributions">
      <h4>${escapeHtml(label)}</h4>
      <ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
    </div>`;
  }

  function linkHtml(href, label) {
    if (!href) return "";
    return `<a class="pixel-btn project-link" href="${escapeHtml(
      href
    )}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || "Open")}</a>`;
  }

  function parseUrl(url) {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  function isYoutube(url) {
    const host = parseUrl(url)?.hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtube-nocookie.com";
  }

  function youtubeId(url) {
    const parsed = parseUrl(url);
    if (!parsed) return "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedAt = parts.indexOf("embed");
    return embedAt >= 0 ? parts[embedAt + 1] || "" : "";
  }

  function canSendReferrer() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  /** YouTube 153: identify this page as the embed host before the player loads. */
  function embedSrc(url) {
    const parsed = parseUrl(url);
    if (!parsed || !isYoutube(url) || !canSendReferrer()) return url;
    parsed.searchParams.set("enablejsapi", "1");
    parsed.searchParams.set("origin", location.origin);
    parsed.searchParams.set("widget_referrer", location.origin);
    return parsed.toString();
  }

  function mountYoutubeFallback(host, url, title) {
    const id = youtubeId(url);
    const watch = id ? `https://www.youtube.com/watch?v=${id}` : url;
    const link = document.createElement("a");
    link.className = "project-embed-fallback";
    link.href = watch;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Watch ${title} on YouTube`);
    if (id) {
      const img = document.createElement("img");
      img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      img.alt = "";
      link.appendChild(img);
    }
    const label = document.createElement("span");
    label.textContent = "Watch on YouTube";
    link.appendChild(label);
    host.appendChild(link);
  }

  /**
   * Build the iframe in the DOM so referrerPolicy is set before src.
   * innerHTML with src first lets the player request fire with no Referer,
   * which is YouTube error 153. file:// has no origin at all, so fall back
   * to a thumbnail that opens the video on YouTube.
   */
  function mountEmbed(host, url, title) {
    host.replaceChildren();
    if (isYoutube(url) && !canSendReferrer()) {
      mountYoutubeFallback(host, url, title);
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = title;
    iframe.allowFullscreen = true;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    host.appendChild(iframe);
    iframe.src = embedSrc(url);
  }

  function renderList(container) {
    container.innerHTML = projects
      .map((section) => {
        const cards = section.projects
          .map((project) => {
            const sizeClass = project.size === "big" ? " project-card--big" : "";
            return `<article class="project-card${sizeClass}" data-project-id="${escapeHtml(
              project.id
            )}" tabindex="0">
              ${mediaHtml(cardMedia(project), "project-thumb")}
              ${awardHtml(project)}
              <h3>${escapeHtml(project.title)}</h3>
              ${contributionsHtml(project)}
              ${stackHtml(project.stack)}
            </article>`;
          })
          .join("");
        return `<section class="projects-section">
          <h2>${escapeHtml(section.title)}</h2>
          <div class="projects-${section.layout}">${cards}</div>
        </section>`;
      })
      .join("");
  }

  function renderDetail(container, project) {
    if (!project) {
      container.innerHTML = "";
      return;
    }
    const desc = project.description ? `<p>${escapeHtml(project.description)}</p>` : "";
    const beats = beatsHtml(project);
    const embed = project.iframe ? `<div class="project-embed" data-embed></div>` : "";
    let hero = embed || mediaHtml(featuredMedia(project), "project-detail-media", { autoplay: true });
    if (beats) hero = embed ? `<section class="beat beat-trailer"><h2>Trailer</h2>${embed}</section>` : "";
    // Borderless is a devlog. The trailer leads the entries, ahead of Log 01.
    const trailerFirst = Boolean(project.devlog && hero);
    container.innerHTML = `
      <div class="project-detail">
        <h1>${escapeHtml(project.title)}</h1>
        ${stackHtml(project.stack)}
        ${awardHtml(project)}
        ${contributionsHtml(project)}
        ${desc}
        ${trailerFirst ? hero : ""}
        ${beats}
        ${trailerFirst ? "" : hero}
        ${detailPhotoHtml(project)}
        ${linkHtml(project.href, "Project website")}
      </div>`;
    const host = container.querySelector("[data-embed]");
    if (host) mountEmbed(host, project.iframe, project.title);
    if (beats) bindBeatPlayers(container);
    else {
      container.querySelectorAll("video").forEach((video) => {
        video.play().catch(() => {});
      });
    }
  }

  function stopMedia(root) {
    if (beatObserver) {
      beatObserver.disconnect();
      beatObserver = null;
    }
    if (!root) return;
    root.querySelectorAll("video").forEach((video) => {
      video.pause();
    });
    root.querySelectorAll("iframe").forEach((frame) => {
      frame.src = "";
    });
  }

  window.PortfolioProjects = {
    sections: projects,
    find: findProject,
    renderList,
    renderDetail,
    stopMedia,
    loadProgress: videoLoadProgress,
    beatsHtml,
    bindBeatPlayers,
    watchStall,
    awardHtml,
    contributionsHtml,
    stackHtml,
    mountEmbed,
    escapeHtml,
  };

  // The toy table shows stills on its slides and streams the beat clips as
  // they come into view, so it has no use for the early card-video fetch
  if (!window.PORTFOLIO_SKIP_VIDEO_PRELOAD) preloadProjectVideos();
})(window.PORTFOLIO_PROJECTS);
