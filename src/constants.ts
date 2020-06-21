export const boardWidth = 6;
export const boardHeight = 12;
export const tileSize = 16;
export const AnimationConstants = {
  swapTicks: 4,
  dropStallTicks: 11,
  dropBounceTicks: 3,
  matchBlinkTicks: 44,
  matchSolidTicks: 20,
  matchPopTicksEach: 9,
  cursorFlex: 32,
};

const fast = false;
if (fast) {
  AnimationConstants.swapTicks = 1;
  AnimationConstants.dropStallTicks = 1;
  AnimationConstants.dropBounceTicks = 3;

  AnimationConstants.matchBlinkTicks = 1;
  AnimationConstants.matchSolidTicks = 1;
  AnimationConstants.matchPopTicksEach = 1;
}
