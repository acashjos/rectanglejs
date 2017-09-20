
window.mainTemplate = (props) => Rectangle.UI.h(
  "div",
  null,
  Rectangle.UI.h(
    "span",
    null,
    "Hello world!"
  ),
  Rectangle.UI.h(
    "span",
    null,
    "Hello world!"
  )
);


//   //## compiled form of the following
//   /** @jsx Rectangle.UI.h */
// <div>
//   <span>Hello world!</span>
//   <span>Hello world!</span>
// </div>
