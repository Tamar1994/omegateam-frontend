export const encontrarCategoriasAtleta = (atleta, categoriasCampeonato, isParatleta = false, anoEvento = new Date().getFullYear()) => {
  if (!atleta || !categoriasCampeonato) return { kyorugui: null, poomsae: null, parataekwondo: null };

  const anoNascimento = parseInt(atleta.nascimento.split('-')[0]);
  const idade = anoEvento - anoNascimento;
  const genero = atleta.sexo === 'M' ? 'Masc' : 'Fem';
  const pesoAtleta = parseFloat(atleta.peso);
  const grad = atleta.graduacao;

  let matches = { kyorugui: null, poomsae: null, parataekwondo: null };

  // --- REGRA 1: PARATAEKWONDO ---
  if (isParatleta) {
    matches.parataekwondo = categoriasCampeonato.find(c => c.modalidade === 'Parataekwondo');
  }

  // --- REGRAS DE GRADUAÇÃO ---
  let gradKyorugui = "";
  let gradPoomsae = "";

  if (["10_gub", "9_gub", "8_gub", "7_gub", "6_gub", "5_gub"].includes(grad)) {
    gradKyorugui = "Colorida (8º a 5º Gub)";
    gradPoomsae = "8º-6º Gub"; // Simplificação para o Poomsae
  } else if (["4_gub", "3_gub", "2_gub", "1_gub"].includes(grad)) {
    gradKyorugui = "Colorida (4º a 1º Gub)";
    gradPoomsae = "2º-1º Gub";
  } else {
    gradKyorugui = "Preta (1º Dan+)";
    gradPoomsae = "Preta (1º Dan+)";
  }

  // --- REGRA 2: KYORUGUI ---
  let divIdadeKyo = "";
  if (idade <= 8) divIdadeKyo = "Sub 08";
  else if (idade <= 11) divIdadeKyo = "Sub 11";
  else if (idade <= 14) divIdadeKyo = gradKyorugui.includes("Preta") ? "Cadete" : "Sub 14";
  else if (idade <= 17) divIdadeKyo = "Sub 17";
  else if (idade <= 30) divIdadeKyo = "Adulto";
  else if (idade <= 35) divIdadeKyo = "Master 1";
  else if (idade <= 40) divIdadeKyo = "Master 2";
  else if (idade <= 45) divIdadeKyo = "Master 3";
  else if (idade <= 50) divIdadeKyo = "Master 4";
  else if (idade <= 55) divIdadeKyo = "Master 5";
  else divIdadeKyo = "Master 6";

  const candidatasKyo = categoriasCampeonato.filter(cat => 
    cat.modalidade === "Kyorugui" &&
    cat.idade_genero.includes(divIdadeKyo) && 
    cat.idade_genero.includes(genero) &&
    cat.graduacao === gradKyorugui
  );

  for (let cat of candidatasKyo) {
    const pesoString = cat.peso_ou_tipo.toLowerCase();
    if (pesoString.includes("até")) {
      const limite = parseFloat(pesoString.replace(/[^\d.-]/g, ''));
      if (pesoAtleta <= limite) { matches.kyorugui = cat; break; }
    } else if (pesoString.includes("+") || pesoString.includes("acima") || pesoString.includes("festival")) {
      matches.kyorugui = cat; break;
    }
  }

  // --- REGRA 3: POOMSAE (Individual) ---
  let divIdadePoom = "";
  if (idade <= 8) divIdadePoom = "Sub 08";
  else if (idade <= 11) divIdadePoom = "Sub 11";
  else if (idade <= 14) divIdadePoom = "Sub 14";
  else if (idade <= 17) divIdadePoom = "Sub 17";
  else if (idade <= 30) divIdadePoom = "Sub 30";
  else if (idade <= 40) divIdadePoom = "Sub 40";
  else if (idade <= 50) divIdadePoom = "Sub 50";
  else if (idade <= 60) divIdadePoom = "Sub 60";
  else if (idade <= 65) divIdadePoom = "Sub 65";
  else divIdadePoom = "Acima 65";

  matches.poomsae = categoriasCampeonato.find(cat => 
    cat.modalidade === "Poomsae" &&
    cat.idade_genero.includes(divIdadePoom) && 
    cat.idade_genero.includes(genero) &&
    cat.graduacao.includes(gradPoomsae) &&
    cat.peso_ou_tipo === "Individual"
  );

  return matches;
};