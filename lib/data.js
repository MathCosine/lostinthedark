const SETS = [
  {
    number: 1,
    points: 4,
    level: 'AMC 8 (Easy)',
    problems: [
      'The sum of 5 consecutive odd integers is 95. What is the largest of the five integers?',
      'If 40% of a number equals 24, what is 75% of that number?',
      "A rectangle's length is twice its width. If its perimeter is 48, what is its area?",
      'What is the remainder when $2^{100}$ is divided by 7?',
    ],
    answers: ['23', '45', '128', '2'],
  },
  {
    number: 2,
    points: 6,
    level: 'AMC 8 (Mid)',
    problems: [
      'In a class, the ratio of boys to girls is $3:5$. After 6 more boys join and 2 girls leave, the ratio becomes $3:4$. How many students were in the class originally?',
      'The product of two positive integers is 180, and their greatest common divisor is 6. What is their sum?',
      'What is the largest two-digit prime $p$ such that reversing the digits of $p$ also gives a prime?',
      'A bag contains 4 red marbles and some blue marbles. The probability of drawing 2 red marbles at random without replacement is $\\dfrac{2}{5}$. How many blue marbles are in the bag?',
    ],
    answers: ['80', '36', '97', '2'],
  },
  {
    number: 3,
    points: 8,
    level: 'AMC 8 (Hard)',
    problems: [
      'A three-digit positive integer has all three digits distinct and summing to 14. The hundreds digit is twice the units digit. How many such integers are there?',
      'What is the sum of all positive two-digit multiples of 7?',
      'In rectangle $ABCD$ with $AB = 12$ and $BC = 8$, point $M$ is the midpoint of $\\overline{BC}$ and point $N$ is the midpoint of $\\overline{CD}$. Find the area of triangle $AMN$.',
      'Compute $1^3 + 2^3 + 3^3 + \\cdots + 10^3$.',
    ],
    answers: ['3', '728', '36', '3025'],
  },
  {
    number: 4,
    points: 10,
    level: 'MATHCOUNTS Chapter',
    problems: [
      'A jar contains red, blue, and green marbles in the ratio $3:4:5$. After 12 green marbles are removed, the ratio becomes $3:4:3$. How many red marbles does the jar contain?',
      'A positive integer $N$ has exactly 3 positive divisors. How many positive divisors does $N^4$ have?',
      'What is the smallest positive integer that leaves a remainder of 3 when divided by 7 and a remainder of 5 when divided by 9?',
      'How many diagonals does a convex 12-gon have?',
    ],
    answers: ['18', '9', '59', '54'],
  },
  {
    number: 5,
    points: 12,
    level: 'MATHCOUNTS Chapter/State',
    problems: [
      'How many ordered pairs of positive integers $(a, b)$ satisfy $a + b + ab = 47$?',
      'A point $P$ lies inside an equilateral triangle with side length 6. The perpendicular distances from $P$ to the three sides are in the ratio $1:2:3$. What is the distance from $P$ to the nearest side? Express your answer in simplest radical form.',
      'A four-digit positive integer has the property that removing its leading digit yields a number equal to exactly $\\dfrac{1}{9}$ of the original. How many such four-digit integers exist?',
      'Compute $\\dfrac{1}{1 \\cdot 2} + \\dfrac{1}{2 \\cdot 3} + \\dfrac{1}{3 \\cdot 4} + \\cdots + \\dfrac{1}{19 \\cdot 20}$. Express as a fraction.',
    ],
    answers: ['8', 'sqrt(3)/2', '7', '19/20'],
  },
  {
    number: 6,
    points: 14,
    level: 'MATHCOUNTS State',
    problems: [
      'Define $a \\oplus b = \\dfrac{ab}{a + b}$ for positive reals $a$ and $b$. Compute $(2 \\oplus 3) \\oplus 6$.',
      'A sequence satisfies $a_1 = 1$ and $a_{n+1} = a_n + \\lfloor\\sqrt{a_n}\\rfloor$ for all positive integers $n$. Find $a_{10}$.',
      'In how many ways can a $2 \\times 8$ rectangle be tiled by $1 \\times 2$ dominoes?',
      'The polynomial $p(x) = x^3 - 7x + 6$ has three integer roots. Find the sum of the squares of its roots.',
    ],
    answers: ['1', '20', '34', '14'],
  },
  {
    number: 7,
    points: 16,
    level: 'MATHCOUNTS State/National',
    problems: [
      'A function $f$ satisfies $f(x) + f(x + 1) = 2x$ for all integers $x$, and $f(1) = 3$. Find $f(7)$.',
      'In triangle $ABC$, $AB = 13$, $BC = 14$, $CA = 15$. Find the length of the altitude from $A$ to $\\overline{BC}$.',
      'How many integers from 1 to 1000 are divisible by at least one of 3, 5, or 7?',
      'A point is chosen uniformly at random from the interior of a square with side length 4. What is the probability that the chosen point is closer to the center of the square than to any of its four corners? Express as a fraction.',
    ],
    answers: ['9', '12', '543', '1/2'],
  },
  {
    number: 8,
    points: 18,
    level: 'MATHCOUNTS National',
    problems: [
      'How many ordered triples of positive integers $(a, b, c)$ with $a \\le b \\le c$ satisfy $a + b + c = 15$?',
      'Square $ABCD$ has side length 4. Point $E$ lies on $\\overline{AB}$ with $AE = 1$, and point $F$ lies on $\\overline{BC}$ with $BF = 1$. Find the area of triangle $DEF$. Express as a fraction.',
      'How many integers from 1 to 500 have an odd number of positive divisors?',
      'Find the largest integer $n$ for which $n^2 - 19n + 99$ is a perfect square.',
    ],
    answers: ['19', '13/2', '22', '18'],
  },
];

function parseAnswer(raw) {
  let s = raw.trim().toLowerCase().replace(/\s+/g, '');
  // √3/2  →  sqrt(3)/2,  and bare sqrt3  →  sqrt(3)
  s = s.replace(/√(\d+(?:\.\d+)?)/g, 'sqrt($1)');
  s = s.replace(/sqrt(\d+(?:\.\d+)?)\b/g, 'sqrt($1)');

  let m = s.match(/^sqrt\((\d+(?:\.\d+)?)\)\/(\d+(?:\.\d+)?)$/);
  if (m) return Math.sqrt(parseFloat(m[1])) / parseFloat(m[2]);

  m = s.match(/^sqrt\((\d+(?:\.\d+)?)\)$/);
  if (m) return Math.sqrt(parseFloat(m[1]));

  m = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    const den = parseFloat(m[2]);
    return den === 0 ? NaN : parseFloat(m[1]) / den;
  }

  const n = parseFloat(s);
  return isNaN(n) ? s : n;
}

function answersMatch(submitted, correct) {
  const s = parseAnswer(submitted);
  const c = parseAnswer(correct);
  if (typeof s === 'number' && typeof c === 'number') return Math.abs(s - c) < 0.0001;
  return String(s).trim().toLowerCase() === String(c).trim().toLowerCase();
}

module.exports = { SETS, answersMatch };
