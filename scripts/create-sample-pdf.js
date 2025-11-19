// Simple script to create a sample PDF for testing
// This uses jsPDF library if available, otherwise provides instructions

const fs = require('fs');
const path = require('path');

// Create a simple text file that can be used as PDF content demo
const sampleContent = `
BONECOLE - ÉCHANTILLON DE DOCUMENT

Ceci est un document d'exemple pour tester le lecteur PDF de l'application Bonecole.

CHAPITRE 1: INTRODUCTION À L'APPRENTISSAGE

L'éducation est la clé du succès. Dans ce document, nous explorons les différentes
méthodes d'apprentissage qui peuvent vous aider à réussir dans vos études.

SECTION 1.1: L'IMPORTANCE DE LA LECTURE

La lecture régulière améliore votre compréhension et votre vocabulaire.
Prenez le temps de lire chaque jour, même si ce n'est que quelques pages.

SECTION 1.2: LA PRATIQUE RÉGULIÈRE

La pratique régulière est essentielle pour maîtriser n'importe quel sujet.
Révisez vos leçons tous les jours et faites des exercices pratiques.

CHAPITRE 2: TECHNIQUES D'ÉTUDE

Voici quelques techniques d'étude efficaces:

1. Créer un emploi du temps d'étude
2. Prendre des notes pendant les cours
3. Réviser régulièrement
4. Former des groupes d'étude
5. Poser des questions à vos enseignants

CHAPITRE 3: MOTIVATION ET PERSÉVÉRANCE

Restez motivé dans votre parcours d'apprentissage. Chaque petit progrès
compte et vous rapproche de vos objectifs.

N'oubliez jamais: "L'éducation est l'arme la plus puissante qu'on puisse
utiliser pour changer le monde." - Nelson Mandela

CONCLUSION

Continuez à apprendre, continuez à grandir, et n'abandonnez jamais vos rêves.
Votre avenir commence maintenant!

---
© 2024 Bonecole - Votre école au bout du doigt
`;

// Save as text file in assets
const outputPath = path.join(__dirname, '../assets/pdfs/sample-document.txt');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, sampleContent, 'utf8');
console.log('Sample document created at:', outputPath);
console.log('\nNote: For a real PDF, you would need to:');
console.log('1. Install jsPDF or pdfkit: npm install pdfkit');
console.log('2. Generate a proper PDF file');
console.log('3. For now, you can use any sample PDF URL for testing');
