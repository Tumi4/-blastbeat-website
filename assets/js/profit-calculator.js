/**
 * Blastbeat ESE Profit Calculator
 * Interactive calculator for students to estimate event earnings
 */
(function () {
  'use strict';

  const ticketSlider = document.getElementById('calc-tickets');
  const ticketOutput = document.getElementById('calc-tickets-value');
  const priceInput = document.getElementById('calc-price');

  const elRevenue = document.getElementById('calc-revenue');
  const elTeam = document.getElementById('calc-team');
  const elClimate = document.getElementById('calc-climate');
  const elShare = document.getElementById('calc-share');

  if (!ticketSlider || !priceInput) return;

  function formatRand(n) {
    return 'R' + Math.round(n).toLocaleString('en-ZA');
  }

  function update() {
    const tickets = parseInt(ticketSlider.value, 10) || 0;
    const price = parseFloat(priceInput.value) || 0;

    const revenue = tickets * price;
    const team = revenue * 0.75;
    const climate = revenue * 0.25;
    const share = team / 14;

    if (ticketOutput) ticketOutput.textContent = tickets;

    elRevenue.textContent = formatRand(revenue);
    elTeam.textContent = formatRand(team);
    elClimate.textContent = formatRand(climate);
    elShare.textContent = formatRand(share);
  }

  // Update the slider fill gradient
  function updateSliderFill() {
    const min = ticketSlider.min || 0;
    const max = ticketSlider.max || 500;
    const val = ticketSlider.value;
    const pct = ((val - min) / (max - min)) * 100;
    ticketSlider.style.setProperty('--fill', pct + '%');
  }

  ticketSlider.addEventListener('input', function () {
    update();
    updateSliderFill();
  });
  ticketSlider.addEventListener('change', function () {
    update();
    updateSliderFill();
  });
  priceInput.addEventListener('input', update);
  priceInput.addEventListener('change', update);

  // Initial calculation
  update();
  updateSliderFill();
})();
