import * as SpeechCommands from '@tensorflow-models/speech-commands';

const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const teachNewButton = document.getElementById('teach');
const teachSyncButton = document.getElementById('teachSync');
const learnWordsInput = document.getElementById('newWord');

const rectangle = document.getElementById('rectangle');

const epochs = 40;

let recognizer;
let transferRecognizer;

const XFER_MODEL_NAME = 'colors';

(async function() {
    console.log('Creating recognizer...');
    recognizer = SpeechCommands.create('BROWSER_FFT');

    // Make sure the tf.Model is loaded through HTTP. If this is not
    // called here, the tf.Model will be loaded the first time
    // `startStreaming()` is called.
    recognizer.ensureModelLoaded()
        .then(() => {
            console.log('Model loaded.');

            const params = recognizer.params();
            console.log(`sampleRateHz: ${params.sampleRateHz}`);
            console.log(`fftSize: ${params.fftSize}`);
            console.log(
                `spectrogramDurationMillis: ` +
                `${params.spectrogramDurationMillis.toFixed(2)}`);
            console.log(
                `tf.Model input shape: ` +
                `${JSON.stringify(recognizer.modelInputShape())}`);
        })
        .catch(err => {
            console.log(
                'Failed to load model for recognizer: ' + err.message);
        });
})();

startButton.addEventListener('click', () => {
    const activeRecognizer =
        transferRecognizer == null ? recognizer : transferRecognizer;
    showWords(activeRecognizer.wordLabels());

    activeRecognizer
        .startStreaming(
            result => {
                plotPredictions(
                    null, activeRecognizer.wordLabels(), result.scores);
            },
            {
                includeSpectrogram: true,
                probabilityThreshold: 0.75
            })
        .then(() => {
            startButton.hidden = true;
            stopButton.hidden = false;
            console.log('Streaming recognition started.');
        })
        .catch(err => {
            console.log(
                'ERROR: Failed to start streaming display: ' + err.message);
        });
});

stopButton.addEventListener('click', () => {
    const activeRecognizer =
        transferRecognizer == null ? recognizer : transferRecognizer;
    activeRecognizer.stopStreaming()
        .then(() => {
            startButton.hidden = false;
            stopButton.hidden = true;
            console.log('Streaming recognition stopped.');
        })
        .catch(err => {
            console.log(
                'ERROR: Failed to stop streaming display: ' + err.message);
        });
});

teachNewButton.addEventListener('click', async() => {
    const transferWord = learnWordsInput.value.trim();
    if (transferWord == null) {
        console.error('Invalid list of transfer words.');
        return;
    }

    if (!transferRecognizer) {
        transferRecognizer = recognizer.createTransfer(XFER_MODEL_NAME);
    }

    teachNewButton.disabled = true;
    const spectrogram = await transferRecognizer.collectExample(transferWord);
    const exampleCounts = transferRecognizer.countExamples();
    console.log(`${transferWord} (${exampleCounts[transferWord]})`);
    console.log(`Collect one sample of word "${transferWord}"`);
    teachNewButton.disabled = false;
});

teachSyncButton.addEventListener("click", async() => {

    const lossValues =
        {x: [], y: [], name: 'train', mode: 'lines', line: {width: 1}};
    const accuracyValues =
        {x: [], y: [], name: 'train', mode: 'lines', line: {width: 1}};
    const plotLossAndAccuracy = (epoch, loss, acc) => {

        lossValues.x.push(epoch);
        lossValues.y.push(loss);
        accuracyValues.x.push(epoch);
        accuracyValues.y.push(acc);

        console.log(`Transfer-learning... (${(epoch / epochs * 1e2).toFixed(0)}%)`);
    };

    await transferRecognizer.train({
        epochs,
        callback: {
            onEpochEnd: async (epoch, logs) => {
                plotLossAndAccuracy(epoch, logs.loss, logs.acc);
            }
        }
    });
    console.log('Transfer learning complete.');

});

const showWords = (words) => {
    console.log(words);
};

const plotPredictions = (canvas, candidateWords, probabilities) => {
    let wordsAndProbs = [];
    for (let i = 0; i < candidateWords.length; ++i) {
        wordsAndProbs.push([candidateWords[i], probabilities[i]]);
    }
    wordsAndProbs = wordsAndProbs.sort((a, b) => (b[1] - a[1]));

    const topWord = wordsAndProbs[0][0];

    const currClass = rectangle.classList.item(1);
    rectangle.classList.remove(currClass);
    rectangle.classList.add(topWord);
    console.log(topWord);
}

