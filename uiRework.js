const rectangle = document.getElementById('rectangle');

export const showWords = (words) => {
  console.log(words);
};

export function plotPredictions(canvas, candidateWords, probabilities) {
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
