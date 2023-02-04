export const viewLoader = (loader) => {
  loader.style.display = 'flex';
  document.body.classList.add('hide-scrolling');
};

export const hideLoader = (loader) => {
  loader.style.display = 'none';
  document.body.classList.remove('hide-scrolling');
};
