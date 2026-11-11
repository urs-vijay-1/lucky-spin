# Lucky Spin 🎡 – Secret Winner Spinner

A modern, responsive, and vibrant Random Name Spinner web application featuring a discreet **Secret Winner Selection System**, optimized with smooth CSS **keyframes**, touch-friendly controls, and dynamic scaling for **mobiles**, **tablets**, and **desktops**.

Built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript**.

---

## 📱 Mobile & Tablet Optimizations

- **Fluid Wheel Scaling**: The wheel dynamically scales using `min(84vw, 500px)` on desktop down to `275px` on small screens (e.g. iPhone SE, Galaxy Fold outer screen).
- **Zero Horizontal Overflow**: Carefully clamped viewports, margins, and safe-area insets (`env(safe-area-inset-bottom)`).
- **Apple HIG & Android Touch Targets**: Minimum 44px+ hit targets on checkboxes, delete buttons, and inputs for effortless thumb tapping.
- **Auto-Zoom Prevention**: Input fields use `1rem` (16px) font sizing on mobile to prevent iOS Safari auto-zooming.
- **Sticky Segmented Mobile Navigation**: Quick-switch tabs (`🎡 Wheel`, `👥 Names`, `🤫 Secret Mode`) sticky at the top on mobile for instant navigation.
- **Auto-Scroll to Wheel on Spin**: When spinning on mobile, the view automatically centers smoothly on the wheel so users never miss the spin.
- **Mobile Audio Unlock**: Web Audio API automatically unlocks on first touch gesture (`touchstart`/`pointerdown`) for audio playback without delays.

---

## 🎨 Rich Keyframe Animations

The application features CSS keyframe animations designed to bring the UI to life:

| Animation Keyframe | Purpose |
|-------------------|---------|
| `@keyframes wheelNeonHalo` | Breathing multi-color neon aura (purple, pink, blue) around the wheel rim |
| `@keyframes spinBtnPulse` | Energetic breathing pulse inviting users to tap the `SPIN NOW` button |
| `@keyframes spinBtnShimmer` | Continuous metallic light reflection sweeping diagonally across the button |
| `@keyframes pointerNeedleBreathe` | Subtle idle levitation of the 12 o'clock pointer needle |
| `@keyframes pointer-deflect` | Realistic spring snap deflection as slice dividers pass the pointer |
| `@keyframes hubGlow` | Pulsing center badge gem reflection |
| `@keyframes floatBlobs` | Ambient floating gradient background orbs drifting organically |
| `@keyframes pulseRotate` | Playful tilting and breathing animation on the header brand icon |
| `@keyframes participantEntry` | Elastic slide-in & pop when new participants are added |
| `@keyframes checkmarkPop` | Bouncy spring scale animation when checking/unchecking participants |
| `@keyframes armedBadgeGlow` | Pulsing aura for the secret winner status badge when armed |
| `@keyframes stealthShieldGlow` | Shimmering border glow on the operator's secret shield |
| `@keyframes pulseDot` | Radar beacon animation confirming secret winner is armed in memory |
| `@keyframes modalCardZoom` | Elastic spring zoom-in on the Winner Celebration modal |
| `@keyframes trophyFloat` | 3D tilting and floating motion of the victory trophy (`🏆`) |
| `@keyframes trophyGlowPulse` | Expanding radial starburst glow behind the trophy |
| `@keyframes sparkleTwinkle` | Multi-phase rotating and twinkling sparkles around the trophy |
| `@keyframes winnerNameShimmer` | Gradient shimmer sweeping across the winner's typography |

---

## 🌟 Core Features & Privacy

### 🤫 Secret Winner Selection System (Most Important Feature)
- **Strictly in Temporary JS Memory**: Stored in variable `secretWinnerId` in RAM only.
- **Zero Storage Footprint**: Never written to `localStorage`, `sessionStorage`, cookies, or database.
- **Hidden from Viewers**:
  - The secret winner dropdown automatically masks the choice immediately after selection (`Armed 🔒`).
  - The winner's name is **never shown**, highlighted, or exposed anywhere on the screen before spinning.
  - In the participant list, all participant cards are 100% identical.
  - On the wheel, all slices are sized and styled equally.
- **Automatic Reset on Changes**: Adding, removing, or toggling participants wipes the secret selection back to fair random.

### 🎯 Mathematical Stopping Precision
The fixed pointer needle sits at 12 o'clock ($270^\circ$). The wheel executes multiple full revolutions ($6 \text{ to } 8 \times 360^\circ$) plus the exact angular offset needed:
$$\Phi_{\text{base}} = \left(270^\circ - (k + 0.5) \cdot \frac{360^\circ}{N}\right) \pmod{360^\circ}$$
The wheel never resets position after spinning, continuing forward naturally on each spin.

---

## 🚀 How to Use
-- visit https://lucky-spin-ebon.vercel.app
