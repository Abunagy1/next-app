import Handlebars from 'handlebars';
import formatDate from './helpersHbs/formatDate';
import formatCurrency from './helpersHbs/formatCurrency';
import eq from './helpersHbs/eq';
import defaultValue from './helpersHbs/defaultValue';
import minToHM from './helpersHbs/minToHM';
import passengers from './helpersHbs/passengers';

let initialized = false;

export function ensureHelpersRegistered() {
  if (initialized) return;
  Handlebars.registerHelper('formatDate', formatDate);
  Handlebars.registerHelper('formatCurrency', formatCurrency);
  Handlebars.registerHelper('eq', eq);
  Handlebars.registerHelper('defaultValue', defaultValue);
  Handlebars.registerHelper('minToHM', minToHM);
  Handlebars.registerHelper('passengers', passengers);
  initialized = true;
}