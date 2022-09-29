import "bootstrap";

// const onShrinkLimit = window.innerHeight / 2;
const onShrinkLimit = 100;

window.onscroll = () => {
  if (
    document.body.scrollTop > onShrinkLimit ||
    document.documentElement.scrollTop > onShrinkLimit
  ) {
    document.querySelector("header").classList.add("is-shrink");
  } else {
    document.querySelector("header").classList.remove("is-shrink");
  }
};
