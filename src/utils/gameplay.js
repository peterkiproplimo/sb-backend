const startCounter = (time) => {
  if (time > 0) {
    time--;
    // (time * 10 - 0.1 * 10) / 10;
    console.log(time);
  }
  return time;
};

function countToTen(time) {
  let time2 = time;
  setInterval(() => {
    if (time2 <= 2) {
      unref();
    }
    time2 = startCounter(time2);
  }, 500);
}

const countDown = async (secondsLeft) => {
  const downloadTimer = await setInterval(() => {
    if (secondsLeft <= 0) {
      clearInterval(downloadTimer);
      console.log("game");
    }
    console.log(secondsLeft.toFixed(2));
    secondsLeft -= 0.1;
  }, 200);
};

async function startGame() {
  const next = await countDown(10);
  return console.log(next);
}

module.exports = { startGame, countDown };
