import { v4 as uuidv4 } from 'uuid';

export const gerarCategoriasFETESP = (incluiParataekwondo, modalidadeGeral) => {
  let categorias = [];

  // Função auxiliar para inserir categorias rapidamente
  const criar = (mod, idade, grad, peso, pesagem) => {
    categorias.push({
      id: uuidv4(),
      modalidade: mod,
      idade_genero: idade,
      graduacao: grad,
      peso_ou_tipo: peso,
      pesagem: pesagem
    });
  };

  // ==========================================
  // 1. GERADOR DE KYORUGUI
  // ==========================================
  if (modalidadeGeral.includes('Kyorugui')) {
    
    // Tabela de Pesos - FAIXAS COLORIDAS
    const pesosColorida = {
      'Sub 11 Masc': ['Até 30 kg', 'Até 35 kg', 'Até 40 kg', 'Até 45 kg', '+ de 45 kg'],
      'Sub 11 Fem': ['Até 30 kg', 'Até 35 kg', 'Até 40 kg', 'Até 45 kg', '+ de 45 kg'],
      'Sub 14 Masc': ['Até 37 kg', 'Até 45 kg', 'Até 53 kg', 'Até 61 kg', 'Acima 61 kg'],
      'Sub 14 Fem': ['Até 37 kg', 'Até 44 kg', 'Até 51 kg', 'Até 59 kg', 'Acima 59 kg'],
      'Sub 17 Masc': ['Até 48 kg', 'Até 55 kg', 'Até 63 kg', 'Até 73 kg', 'Acima 73 kg'],
      'Sub 17 Fem': ['Até 44 kg', 'Até 49 kg', 'Até 55 kg', 'Até 63 kg', 'Acima 63 kg'],
      'Adulto Masc': ['Até 58 kg', 'Até 68 kg', 'Até 80 kg', '+ de 80 kg'],
      'Adulto Fem': ['Até 49 kg', 'Até 57 kg', 'Até 67 kg', '+ de 67 kg'],
    };
    // Masters Colorida usam pesos do Adulto
    for(let i=1; i<=8; i++) {
        pesosColorida[`Master ${i} Masc`] = pesosColorida['Adulto Masc'];
        pesosColorida[`Master ${i} Fem`] = pesosColorida['Adulto Fem'];
    }

    // Tabela de Pesos - FAIXAS PRETAS
    const pesosPreta = {
      'Sub 11 Masc': ['Até 30 kg', 'Até 35 kg', 'Até 40 kg', 'Até 45 kg', '+ de 45 kg'],
      'Sub 11 Fem': ['Até 30 kg', 'Até 35 kg', 'Até 40 kg', 'Até 45 kg', '+ de 45 kg'],
      'Sub 14 Masc': ['Até 33 kg', 'Até 37 kg', 'Até 41 kg', 'Até 45 kg', 'Até 49 kg', 'Até 53 kg', 'Até 57 kg', 'Até 61 kg', 'Até 65 kg', '+ de 65 kg'],
      'Sub 14 Fem': ['Até 29 kg', 'Até 33 kg', 'Até 37 kg', 'Até 41 kg', 'Até 44 kg', 'Até 47 kg', 'Até 51 kg', 'Até 55 kg', 'Até 59 kg', '+ de 59 kg'],
      'Sub 17 Masc': ['Até 45 kg', 'Até 48 kg', 'Até 51 kg', 'Até 55 kg', 'Até 59 kg', 'Até 63 kg', 'Até 68 kg', 'Até 73 kg', 'Até 78 kg', '+ de 78 kg'],
      'Sub 17 Fem': ['Até 42 kg', 'Até 44 kg', 'Até 46 kg', 'Até 49 kg', 'Até 52 kg', 'Até 55 kg', 'Até 59 kg', 'Até 63 kg', 'Até 68 kg', '+ de 68 kg'],
      'Adulto Masc': ['Até 54 kg', 'Até 58 kg', 'Até 63 kg', 'Até 68 kg', 'Até 74 kg', 'Até 80 kg', 'Até 87 kg', '+ de 87 kg'],
      'Adulto Fem': ['Até 46 kg', 'Até 49 kg', 'Até 53 kg', 'Até 57 kg', 'Até 62 kg', 'Até 67 kg', 'Até 73 kg', '+ de 73 kg'],
    };
    for(let i=1; i<=4; i++) {
        pesosPreta[`Master ${i} Masc`] = pesosPreta['Adulto Masc'];
        pesosPreta[`Master ${i} Fem`] = pesosPreta['Adulto Fem'];
    }
    for(let i=5; i<=8; i++) {
        pesosPreta[`Master ${i} Masc`] = ['Até 58 kg', 'Até 68 kg', 'Até 80 kg', '+ de 80 kg'];
        pesosPreta[`Master ${i} Fem`] = ['Até 49 kg', 'Até 57 kg', 'Até 67 kg', '+ de 67 kg'];
    }

    const gradCol1 = 'Colorida (8º a 5º Gub)';
    const gradCol2 = 'Colorida (4º a 1º Gub)';
    const gradPreta = 'Preta (1º Dan+)';

    // Festivais Mirim
    ['Masc', 'Fem'].forEach(sexo => {
      criar('Kyorugui', `Sub 08 ${sexo}`, 'Colorida (10º a 5º Gub)', 'Festival', false);
      criar('Kyorugui', `Sub 08 ${sexo}`, 'Colorida (4º Gub acima)', 'Festival', false);
    });

    const divisoes = ['Sub 11', 'Sub 14', 'Sub 17', 'Adulto', 'Master 1', 'Master 2', 'Master 3', 'Master 4', 'Master 5', 'Master 6', 'Master 7', 'Master 8'];

    divisoes.forEach(div => {
      ['Masc', 'Fem'].forEach(sexo => {
        const cat = `${div} ${sexo}`;
        
        // Colorida 8 a 5 (Nunca pesa)
        pesosColorida[cat]?.forEach(peso => criar('Kyorugui', cat, gradCol1, peso, false));
        
        // Colorida 4 a 1 (Pesa até Adulto, Não pesa para Master)
        const pesaCol2 = !div.includes('Master');
        pesosColorida[cat]?.forEach(peso => criar('Kyorugui', cat, gradCol2, peso, pesaCol2));

        // Preta (Sempre pesa)
        pesosPreta[cat]?.forEach(peso => criar('Kyorugui', cat, gradPreta, peso, true));
      });
    });

    // Sub 21 (Apenas Preta)
    pesosPreta['Adulto Masc'].forEach(peso => criar('Kyorugui', 'Sub 21 Masc', gradPreta, peso, true));
    pesosPreta['Adulto Fem'].forEach(peso => criar('Kyorugui', 'Sub 21 Fem', gradPreta, peso, true));
  }

  // ==========================================
  // 2. GERADOR DE POOMSAE
  // ==========================================
  if (modalidadeGeral.includes('Poomsae')) {
    const idadesPoomCol = ['Sub 11', 'Sub 14', 'Sub 17', 'Sub 30', 'Sub 40', 'Sub 50', 'Sub 60', 'Sub 65', 'Acima 65'];
    
    // Colorida Individual
    ['Masc', 'Fem'].forEach(sexo => {
      ['10º-7º Gub', '6º-4º Gub', '3º-1º Gub'].forEach(grad => criar('Poomsae', `Sub 08 ${sexo}`, grad, 'Individual', false));
      idadesPoomCol.forEach(idade => {
        ['8º-6º Gub', '5º-3º Gub', '2º-1º Gub'].forEach(grad => criar('Poomsae', `${idade} ${sexo}`, grad, 'Individual', false));
      });
    });

    // Colorida Pares/Equipe
    ['Sub 14', 'Sub 17', 'Sub 30', 'Sub 50', 'Sub 60', 'Acima 60'].forEach(idade => {
      ['8º-6º Gub', '5º-3º Gub', '2º-1º Gub'].forEach(grad => {
         criar('Poomsae', `${idade} Misto`, grad, 'Pares', false);
         criar('Poomsae', `${idade} Masc`, grad, 'Equipe', false);
         criar('Poomsae', `${idade} Fem`, grad, 'Equipe', false);
      });
    });

    // Preta Individual
    ['Sub 08', 'Sub 11', 'Sub 14', 'Sub 17', 'Sub 30', 'Sub 40', 'Sub 50', 'Sub 60', 'Sub 65', 'Acima 65'].forEach(idade => {
      criar('Poomsae', `${idade} Masc`, 'Preta (1º Dan+)', 'Individual', false);
      criar('Poomsae', `${idade} Fem`, 'Preta (1º Dan+)', 'Individual', false);
    });

    // Preta Pares/Equipe
    ['Sub 14', 'Sub 17', 'Sub 30', 'Sub 50', 'Sub 60', 'Acima 60'].forEach(idade => {
      criar('Poomsae', `${idade} Misto`, 'Preta (1º Dan+)', 'Pares', false);
      criar('Poomsae', `${idade} Masc`, 'Preta (1º Dan+)', 'Equipe', false);
      criar('Poomsae', `${idade} Fem`, 'Preta (1º Dan+)', 'Equipe', false);
    });

    // Free Style
    ['Até 17 anos', '+ 17 anos'].forEach(idade => {
      ['Masc', 'Fem'].forEach(sexo => {
        criar('Poomsae', `${idade} ${sexo}`, 'Colorida (6º a 1º Gub)', 'Free Style Individual', false);
        criar('Poomsae', `${idade} ${sexo}`, 'Preta (1º Dan+)', 'Free Style Individual', false);
      });
      criar('Poomsae', `${idade} Misto`, 'Colorida (6º a 1º Gub)', 'Free Style Pares / Equipe', false);
      criar('Poomsae', `${idade} Misto`, 'Preta (1º Dan+)', 'Free Style Pares / Equipe', false);
    });
  }

  // ==========================================
  // 3. GERADOR DE PARATAEKWONDO
  // ==========================================
  if (incluiParataekwondo) {
    criar('Parataekwondo', 'Parataekwondo', 'Inscrição PARATKD', 'Triagem de Laudo', false);
  }

  return categorias;
};