/**
 * Generates the color buttons for the toolbar
 *
 * @param colors the array of colors for which to make buttons in the toolbar
 * @param handleColorClick a handler to set the new color
 */
export const setupColorButtons = (
  colors: string[],
  handleColorClick: (color: string) => void,
): void => {
  const toolbarEl = document.getElementById('toolbar');
  const colorButtons = colors.map((color) => {
    // create el with attributes
    const colorEl = document.createElement('button');
    colorEl.className = 'color-btn';
    colorEl.style = `background: ${color}`;
    colorEl.dataset.color = color;

    // add to toolbar
    toolbarEl?.appendChild(colorEl);
    return colorEl;
  });

  // create the click lister (depends on the button array)
  const onColorClick = (ev: PointerEvent) => {
    const clicked = ev.currentTarget as HTMLElement;
    if (!clicked.dataset.color) {
      return;
    }
    // back to main with the new color
    handleColorClick(clicked.dataset.color);

    // remove .active from the other colors, add to clicked btn
    for (let i = 0; i < colorButtons.length; i++) {
      colorButtons.forEach((btn) => btn.classList.remove('active'));
    }
    clicked.classList.add('active');
  };

  // set the click listener on each button
  colorButtons.forEach((btn) => {
    btn.onclick = onColorClick;
  });
};
