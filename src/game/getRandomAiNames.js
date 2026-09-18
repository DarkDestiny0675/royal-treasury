const AI_FIRST_NAMES = [
  "Aiden",
  "Amelia",
  "Aria",
  "Ava",
  "Caleb",
  "Chloe",
  "Clara",
  "Daniel",
  "Elena",
  "Elias",
  "Ethan",
  "Eva",
  "Felix",
  "Finn",
  "Grace",
  "Hazel",
  "Henry",
  "Isla",
  "Ivy",
  "Jasper",
  "Julian",
  "Layla",
  "Leo",
  "Liam",
  "Lily",
  "Lucas",
  "Luna",
  "Marcus",
  "Maya",
  "Mia",
  "Milo",
  "Nora",
  "Oliver",
  "Olivia",
  "Owen",
  "Roman",
  "Ruby",
  "Samuel",
  "Sophia",
  "Theo",
  "Victor",
  "Violet",
  "William",
  "Zoe",
];

export function getRandomAiNames(numberOfNames) {
  const availableNames = [...AI_FIRST_NAMES];

  const selectedNames = [];

  while (selectedNames.length < numberOfNames && availableNames.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableNames.length);

    const selectedName = availableNames[randomIndex];

    selectedNames.push(selectedName);

    availableNames.splice(randomIndex, 1);
  }

  return selectedNames;
}
