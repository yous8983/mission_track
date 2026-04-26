/// <reference types="react-scripts" />

// Suppress Ionic web component JSX type errors
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
