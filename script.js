const fundamentalInput = document.getElementById("fundamental");
const multiplierInput = document.getElementById("multiplier");
const volumeSlider = document.getElementById("volume");

const outputDisplay = document.getElementById("outputFrequency");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

const fundMinus = document.getElementById("fundMinus");
const fundPlus = document.getElementById("fundPlus");

const multMinus = document.getElementById("multMinus");
const multPlus = document.getElementById("multPlus");

let audioContext = null;
let oscillator = null;
let gainNode = null;
let holdTimeout;
let holdInterval;

function getVolume() {
    return Math.pow(Number(volumeSlider.value) / 100, 2);
}

let volume = getVolume();

// ------------------------------ press and hold 

function setupSpinner(button, input, direction) {

    const change = () => changeValue(input, direction);

    button.addEventListener("click", (e) => {
        // Prevent the click after a long press from adding one more step
        if (button.dataset.held === "true") {
            button.dataset.held = "false";
            e.preventDefault();
            return;
        }

        change();
    });

    const startHold = () => {

        button.dataset.held = "false";

        holdTimeout = setTimeout(() => {

            button.dataset.held = "true";

            change();

            holdInterval = setInterval(change, 50); // 20 times/sec

        }, 400);

    };

    const stopHold = () => {

        clearTimeout(holdTimeout);
        clearInterval(holdInterval);

    };

    button.addEventListener("mousedown", startHold);
    button.addEventListener("touchstart", startHold);

    button.addEventListener("mouseup", stopHold);
    button.addEventListener("mouseleave", stopHold);

    button.addEventListener("touchend", stopHold);
    button.addEventListener("touchcancel", stopHold);

}

function getFrequency() {
    return Number(fundamentalInput.value) * Number(multiplierInput.value);
}

function updateDisplay() {

    const freq = getFrequency();

    outputDisplay.textContent = freq.toFixed(2) + " Hz" ; // was freq + " Hz"

    if (oscillator) {
        oscillator.frequency.setValueAtTime(
            freq,
            audioContext.currentTime
        );
    }
}

function updateVolume() {
    volume = getVolume();

    if (gainNode) {
        const currentGain = gainNode.gain.value;

        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(currentGain, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            volume,
            audioContext.currentTime + 0.05
        );
    }
}

function formatValue(input, value) {
    const decimals = (input.step.split(".")[1] || "").length;
    return value.toFixed(decimals);
}

function changeValue(input, amount) {

    const step = Number(input.step) || 1;
    const min = Number(input.min) || 0;

    let value = Number(input.value);

    value += amount * step;

    value = Math.max(min, value);

    input.value = formatValue(input, value);

    updateDisplay();

}

function startTone() {

    if (oscillator) return;

    if (!audioContext) {
        audioContext = new AudioContext();
    }

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = getFrequency();
    volume = getVolume();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start silent
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    oscillator.start();

    // Fade in
    gainNode.gain.linearRampToValueAtTime(
        volume,  
        audioContext.currentTime + 0.02
    );
}

function stopTone() {

    if (!oscillator) return;

    gainNode.gain.cancelScheduledValues(audioContext.currentTime);

    gainNode.gain.setValueAtTime(
        gainNode.gain.value,
        audioContext.currentTime
    );

    gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + 0.22
    );

    oscillator.stop(audioContext.currentTime + 0.22);

    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();

        oscillator = null;
        gainNode = null;
    };

}

fundamentalInput.addEventListener("input", updateDisplay);

multiplierInput.addEventListener("input", updateDisplay);

volumeSlider.addEventListener("input", updateVolume);

startButton.addEventListener("click", startTone);

stopButton.addEventListener("click", stopTone);

setupSpinner(fundMinus, fundamentalInput, -1);
setupSpinner(fundPlus, fundamentalInput, 1);

setupSpinner(multMinus, multiplierInput, -1);
setupSpinner(multPlus, multiplierInput, 1);

updateDisplay();