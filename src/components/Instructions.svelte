<script lang="ts">
  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();
</script>

<div class="instructions">
  <header>
    <button class="back-btn" onclick={onBack}>← Back</button>
    <h1>How to Play</h1>
  </header>

  <div class="content">

    <section>
      <h2>What is Preferance?</h2>
      <p>
        Preferance is a classic trick-taking card game for <strong>3 players</strong>,
        popular in Russia and Eastern Europe. Think of it as a cousin of Bridge
        — you bid to declare a contract, then try to win tricks to fulfill it.
      </p>
      <p>
        In this app, you play against two AI opponents (West and East).
      </p>
    </section>

    <section>
      <h2>The Deck</h2>
      <p>
        A <strong>32-card deck</strong> — standard cards but only 7 through Ace
        in each suit. No 2s, 3s, 4s, 5s, or 6s.
      </p>
      <div class="card-display">
        <span>7 · 8 · 9 · 10 · J · Q · K · A</span>
        <span class="suits">
          <span class="black">♠ ♣</span>
          <span class="red">♦ ♥</span>
        </span>
      </div>
    </section>

    <section>
      <h2>Dealing</h2>
      <p>
        Each player gets <strong>10 cards</strong>. The remaining 2 cards go
        face-down to the <strong>talon</strong> (a small pile in the center).
      </p>
      <p>
        The dealer rotates each hand. The player to the dealer's left
        (<strong>eldest hand</strong>) always acts first.
      </p>
    </section>

    <section>
      <h2>1. Bidding</h2>
      <p>
        Players take turns bidding or passing. A bid is a promise:
        <em>"I can win at least X tricks with this trump suit."</em>
      </p>
      <div class="example">
        <strong>6♥</strong> = "I'll win at least 6 tricks with Hearts as trump"<br/>
        <strong>7NT</strong> = "I'll win 7 tricks with no trump suit"
      </div>
      <p>
        Bids go up in order: suits rank
        <span class="black">♠</span> <span class="black">♣</span>
        <span class="red">♦</span> <span class="red">♥</span> NT,
        then trick count 6→10.
        Each new bid must be higher than the last.
      </p>
      <p>
        <strong>Special:</strong> The eldest hand (first to bid) can <em>match</em> the
        current bid instead of raising. Other players must strictly raise.
      </p>
      <p>
        Once you pass, you're out of the auction. Bidding ends when only one
        bidder remains — they become the <strong>declarer</strong>.
      </p>
    </section>

    <section>
      <h2>2. The Talon</h2>
      <p>
        The declarer flips the 2 talon cards <strong>face-up</strong> for all to see,
        then takes them into their hand (now 12 cards).
      </p>
      <p>
        The declarer then <strong>discards 2 cards</strong> face-down and
        declares their final contract (which can be raised above their winning bid).
      </p>
    </section>

    <section>
      <h2>3. Whisting</h2>
      <p>
        After the contract is declared, each defender chooses:
      </p>
      <ul>
        <li><strong>Whist</strong> — actively defend, trying to prevent the declarer from making their contract</li>
        <li><strong>Pass</strong> — sit out (your hand may be played face-up by the whisting partner)</li>
      </ul>
      <p>
        If <strong>both pass</strong>, the declarer wins automatically.
      </p>
      <div class="rule-note">
        <strong>Stalingrad rule:</strong> On a 6♠ contract, both defenders
        <em>must</em> whist — no passing allowed.
      </div>
    </section>

    <section>
      <h2>4. Playing Tricks</h2>
      <p>
        The eldest hand leads the first trick. Play follows strict rules:
      </p>
      <ol>
        <li><strong>Must follow suit</strong> — if you have a card of the led suit, you must play it</li>
        <li><strong>Must trump</strong> — if you can't follow suit but have a trump card, you must play it</li>
        <li><strong>Free discard</strong> — only if you have neither the led suit nor trumps can you play anything</li>
      </ol>
      <p>
        The highest trump wins the trick. If no trumps were played, the
        highest card of the led suit wins. The winner leads the next trick.
      </p>
      <div class="rule-note">
        The game will highlight which cards you can legally play with a
        <span class="glow-text">golden glow</span>, and show a hint
        explaining why.
      </div>
    </section>

    <section>
      <h2>5. Misere</h2>
      <p>
        A special bid ranked between 8NT and 9♠. The declarer promises to
        win <strong>zero tricks</strong>. There are no trumps.
      </p>
      <p>
        After the declarer picks up the talon and discards, the defenders
        play with their cards <strong>face-up</strong>. Each defender plays
        independently (selfish mode).
      </p>
    </section>

    <section>
      <h2>6. All-Pass (Raspasovka)</h2>
      <p>
        If <strong>all three players pass</strong> without bidding, it's an
        all-pass round. The goal reverses — try to take <strong>as few tricks
        as possible</strong>.
      </p>
      <p>
        The talon is flipped face-up. Its two cards determine which suit
        must be led on tricks 1 and 2. No trumps.
      </p>
      <p>
        Consecutive all-pass rounds escalate penalties:
        <strong>×1 → ×2 → ×3</strong>.
      </p>
    </section>

    <section>
      <h2>Scoring</h2>
      <p>Three types of points are tracked on the score sheet:</p>

      <div class="score-types">
        <div class="score-type">
          <span class="pool-color">Pool</span>
          <span>Earned by winning your contract. Reach 20 to close your pool.</span>
        </div>
        <div class="score-type">
          <span class="dump-color">Dump</span>
          <span>Penalty points for failing contracts or taking tricks in all-pass.</span>
        </div>
        <div class="score-type">
          <span class="whist-color">Whists</span>
          <span>Earned by defenders for each trick taken against the declarer.</span>
        </div>
      </div>

      <h3>Contract values</h3>
      <table class="values-table">
        <tbody>
          <tr><th>Tricks</th><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>Mis.</td></tr>
          <tr><th>Value</th><td>2</td><td>4</td><td>6</td><td>8</td><td>10</td><td>10</td></tr>
        </tbody>
      </table>

      <h3>What happens after tricks are played</h3>
      <ul>
        <li><strong>Declarer succeeds:</strong> earns the contract value in pool points</li>
        <li><strong>Declarer fails:</strong> gets value × undertricks in dump, opponents get whist compensation</li>
        <li><strong>Misere success:</strong> +10 pool</li>
        <li><strong>Misere failure:</strong> +10 dump per trick taken</li>
        <li><strong>All-pass:</strong> each trick = 1 dump (× multiplier). Zero tricks = 1 pool</li>
      </ul>
    </section>

    <section>
      <h2>Winning</h2>
      <p>
        The game ends when <strong>all players reach 20 pool points</strong>.
        Final scores are calculated by converting everything to whist points
        — the result is zero-sum (one player's gain is another's loss).
      </p>
      <p>
        <strong>The player with the highest final score wins!</strong>
      </p>
    </section>

    <section>
      <h2>Quick Tips</h2>
      <ul class="tips">
        <li>Bid conservatively at first — failing a contract is costly</li>
        <li>Count your sure tricks (Aces, guarded Kings) before bidding</li>
        <li>The talon can improve your hand — but don't rely on it</li>
        <li>When defending, whist if you have Aces or long trump holdings</li>
        <li>In all-pass, lead your lowest cards and dump high cards when you can't follow suit</li>
        <li>Watch the glowing cards — they show exactly what you can legally play</li>
      </ul>
    </section>

  </div>
</div>

<style>
  .instructions {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at center, var(--felt-light), var(--felt-dark));
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  header h1 {
    font-size: 1.2em;
    color: var(--gold);
    font-family: 'Georgia', serif;
  }

  .back-btn {
    padding: 8px 14px;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: var(--text-light);
    font-size: 0.9em;
    font-weight: bold;
  }

  .back-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    padding-bottom: max(32px, env(safe-area-inset-bottom, 32px));
    -webkit-overflow-scrolling: touch;
  }

  section {
    margin-bottom: 28px;
  }

  h2 {
    color: var(--gold);
    font-size: 1.15em;
    margin-bottom: 8px;
    font-family: 'Georgia', serif;
    border-bottom: 1px solid rgba(212, 168, 67, 0.3);
    padding-bottom: 4px;
  }

  h3 {
    color: var(--text-light);
    font-size: 0.95em;
    margin: 12px 0 6px;
  }

  p {
    color: var(--text-light);
    font-size: 0.9em;
    line-height: 1.6;
    margin-bottom: 8px;
  }

  ul, ol {
    color: var(--text-light);
    font-size: 0.9em;
    line-height: 1.6;
    padding-left: 20px;
    margin-bottom: 8px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    color: var(--card-white);
  }

  em {
    color: var(--gold);
    font-style: italic;
  }

  .card-display {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 10px 16px;
    text-align: center;
    font-size: 1.1em;
    font-family: 'Georgia', serif;
    color: var(--text-light);
    margin: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .suits {
    font-size: 1.3em;
    letter-spacing: 4px;
  }

  .black { color: var(--black-suit); }
  .red { color: var(--red-suit); }

  .example {
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid var(--gold);
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
    margin: 8px 0;
    font-size: 0.88em;
    color: var(--text-light);
    line-height: 1.7;
  }

  .rule-note {
    background: rgba(212, 168, 67, 0.1);
    border: 1px solid rgba(212, 168, 67, 0.3);
    border-radius: 8px;
    padding: 10px 14px;
    margin: 8px 0;
    font-size: 0.85em;
    color: var(--text-light);
    line-height: 1.6;
  }

  .glow-text {
    color: var(--gold);
    text-shadow: 0 0 6px rgba(212, 168, 67, 0.6);
  }

  .score-types {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 8px 0;
  }

  .score-type {
    display: flex;
    gap: 10px;
    align-items: baseline;
    font-size: 0.88em;
    color: var(--text-light);
  }

  .pool-color { color: #4caf50; font-weight: bold; min-width: 50px; }
  .dump-color { color: #f44336; font-weight: bold; min-width: 50px; }
  .whist-color { color: #90caf9; font-weight: bold; min-width: 50px; }

  .values-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 0.88em;
  }

  .values-table th, .values-table td {
    padding: 6px 8px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: var(--text-light);
  }

  .values-table th {
    color: var(--text-muted);
    font-weight: bold;
  }

  .tips {
    list-style: none;
    padding-left: 0;
  }

  .tips li {
    padding-left: 20px;
    position: relative;
  }

  .tips li::before {
    content: '💡';
    position: absolute;
    left: 0;
  }
</style>
