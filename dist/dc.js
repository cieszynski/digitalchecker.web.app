
class QuizTimer extends HTMLElement {

    static observedAttributes = ['duration'];

    static format = (ms) => new Date(ms)
        .toISOString()
        .slice((ms >= 3600000)
            ? 12    // 0:00:00
            : 14,   //   00:00
            19);

    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
<svg viewBox="0 0 90 90">
    <style>
        @keyframes pacer {}

        @keyframes timer {
            0% {
                stroke-width: 0px;
                stroke-dashoffset: -100px;
            }
            0.1% {
                stroke-width: 7px;
            }

            to {
                stroke-width: 7px;
                stroke-dashoffset: 0px;
            }
        }

        :host {
            /* position: relative; */
        }

        circle {
            fill: none;
            stroke: var(--background-color, lightgray);
            stroke-width: 7px;
        }

        path {
            fill: none;
            stroke-width: 0px;
            stroke: var(--color, black);
            stroke-linecap: round;
            animation: 3s linear .01s both paused timer,
                1s linear 4 .01s both paused pacer;
        }

        text {
            stroke: none;
            fill: currentColor;
            font-family: sans;
            font-size: 20px;
        }
    </style>
    <circle cx="45" cy="45" r="40" />
    <path id="p" d="M 45 5 A 20 20 0 0 1 45 85 A 20 20 0 0 1 45 5" 
        stroke-dasharray="100"
        pathLength="100" />
    <text x="45" y="47.5" dominant-baseline="middle" text-anchor="middle">00:00</text>
</svg>`;

        const path = this.shadowRoot.querySelector('path');

        path.addEventListener('animationstart', (e) => {
            if (e.animationName == 'timer') {
                const event = new CustomEvent('quiztimerstart', {
                    bubbles: true,
                    detail: {
                        duration: this.duration
                    }
                });

                this.dispatchEvent(event)
                this.onstart(event);
            }
        });

        path.addEventListener('animationend', (e) => {
            if (e.animationName == 'timer') {
                const event = new CustomEvent('quiztimerend', {
                    bubbles: true,
                    detail: {
                        duration: this.duration
                    }
                });

                this.dispatchEvent(event)
                this.onend(event);
            }
        });

        path.addEventListener('animationiteration', (e) => {
            this.shadowRoot
                .querySelector('text')
                .textContent = QuizTimer
                    .format(this.duration - e.elapsedTime * 1000);
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'duration':
                this.duration = parseInt(newValue);
                this.shadowRoot
                    .querySelector('text')
                    .textContent = QuizTimer
                        .format(this.duration);
                break;
        }
    }

    onpause(e) { console.debug(e); }
    onstart(e) { console.debug(e); }
    onend(e) { console.debug(e); }

    start() {
        const duration = parseInt(this.duration);

        this.shadowRoot
            .querySelector('path')
            .getAnimations()
            .map((animation) => {
                animation.effect.updateTiming(
                    (animation.animationName == 'pacer') ? {
                        duration: duration / (duration / 1000),
                        iterations: (duration / 1000) + 1
                    } : {
                        duration: duration,
                    }
                );
                animation.play();
            });
    }

    pause() {
        let anim;

        this.shadowRoot
            .querySelector('path')
            .getAnimations()
            .map((animation) => {
                anim = animation;
                anim.pause();
            });

        const event = new CustomEvent('quiztimerpause', {
            bubbles: true,
            detail: {
                currentTime: anim.currentTime,
                duration: this.duration
            }
        });

        this.dispatchEvent(event)
        this.onpause(event);
    }

    finish() {
        this.shadowRoot
            .querySelector('path')
            .getAnimations()
            .map((animation) => animation.finish());
    }
}

customElements.define("dc-quiztimer", QuizTimer);

// play(time, by)
const play = (time, by) => new Promise((resolve, reject) => {
    console.assert(typeof time === 'number', `play(time, by): <time> must be type of number, not ${typeof time}`);
    console.assert(typeof by === 'number', `play(time, by): <by> must be type of number, not ${typeof time}`);
    console.assert(by >= 0, 'play(time, by): <by> must be non-negative or auto');
console.log(time, by)
    document
        .getAnimations()
        .forEach((animation) => {
            animation.currentTime = time;
            animation.play();
        });

    document.body
        .animate([], { duration: by })
        .onfinish = (e) => {
            document
                .getAnimations()
                .forEach((animation) => {animation.pause(); console.log(animation.currentTime)});
            resolve(time + by);
        }
});

// add(element, pseudoElement, scenes)
// add(element, scenes)
const add = (element, ...args) => {
    console.assert(args.length);

    const scenes = args.pop();
    const pseudoElement = args.pop();   // could be null

    for (const [time, keyFrameEffect] of Object.entries(scenes)) {
        element
            .animate(keyFrameEffect.k, Object.assign({
                pseudoElement: pseudoElement,
               // fill: 'forwards',
                delay: time
            }, keyFrameEffect.o))
            .pause();
    };
}

const run = () => {
    
}