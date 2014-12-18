/**
 * HTML Parser
 * Recebe um código HTML como parâmetro e identifica a ocorrência 
 * de erros e alerta possíveis erros segundo o e-MAG v3.0.
 * 
 * Adaptação do HTML Parser feito por John Resig
 * http://ejohn.org/files/htmlparser.js
 * Código original de Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * @author Victor Adriel de J. Oliveira
 */

(function(){

	// Expressões regulares para o parsing de tags e attributes
	var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+[-:]?\w*[-:]?\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
		attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
		
	// Elementos vazios - HTML 4.01
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

	// Elementos de bloco - HTML 4.01
	var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

	// Elementos inline - HTML 4.01
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

	// Elementos que você, intencionalmente, pode deixar abertos
	// (e que feicham a si mesmos)
	var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

	// Atributos que têm seus valores preenchidos assim: disabled="disabled"
	var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

	// Elementos especiais (pode não conter nada) 
	// Na versão de John Resig havia o elemento Script.
	var special = makeMap("style");	
	
	// Inicializa array de mensagens (erros/alertas)
	mens = new Array();
	mens[0] = new mensDetail(0, 0, "Variavel para armazenamento de erros no processo de análise", "Uso do sistema", ""); // Status 0:SUCCESS / 1:ERROR 
	mens[1] = new mensDetail(0, 0, "Múltiplas ocorrências do elemento 'H1'", "<span>Recomendação 3:</span><h4>Utilizar corretamente os níveis de cabeçalho.</h4><p>Os níveis de cabeçalho devem ser utilizados de forma lógica e semântica para facilitar a leitura e compreensão. Cada página deverá ter apenas um h1, já os níveis do h2 ao h6 poderão ser utilizados mais de uma vez na página.</p>", ", nas linhas: ");
	mens[2] = new mensDetail(0, 0, "Valor do atributo tabindex menor que anterior", "<span>Recomendação 4:</span><h4>Ordenar de forma lógica e intuitiva a leitura e tabulação.</h4><p>Deve-se criar o código HTML com uma sequência lógica de leitura para percorrer links, controles de formulários e objetos. Essa sequência é determinada pela ordem que se encontra no código HTML. O atributo tabindex somente deverá ser utilizado quando existir real necessidade e deve se evitar uma ordem de tabulação inconsistente.</p>", ", nas linhas: ");
	mens[3] = new mensDetail(0, 0, "Ocorrência de target='_blank'", "<span>Recomendação 9:</span><h4>Não abrir novas instâncias sem a solicitação do usuário.</h4><p>A decisão de utilizar novas instâncias é do cidadão. Assim, não devem ser utilizadas pop-ups ou abertas novas abas e/ou janelas, por exemplo, que não tenham sido solicitadas pelo usuário. Obs: A função 'alert' do javascript não gera um pop-up, mas uma mensagem que pode ser lida por leitores de tela.</p>", ", nas linhas: ");
	mens[4] = new mensDetail(0, 0, "Uso do elemento 'script' sem 'noscript'", "<span>Recomendação 10:</span><h4>Garantir que os objetos programáveis sejam acessíveis.</h4><p>O script deve ser desenvolvido tomando-se o cuidado para que seja acessível, e o elemento noscript deve ser utilizado para abranger os casos em que scripts não são suportados.</p>", " "); //ERRO SEM LINHA
	mens[5] = new mensDetail(0, 0, "Página sendo recarregada automaticamente", "<span>Recomendação 11:</span><h4>Não criar páginas com atualização automática periódica.</h4><p>Não deve ser utilizada a meta tag refresh, nem outra forma de atualização automática. Páginas que se atualizam automaticamente podem confundir e desorientar os usuários, especialmente os que utilizam leitores de tela.</p><span>Recomendação 12:</span><h4>Não utilizar redirecionamento automático de páginas.</h4><p>Não devem ser utilizadas marcações para redirecionar para uma nova página, como a meta tag refresh. Ao invés disso, deve-se configurar o servidor para que o redirecionamento seja transparente para o usuário.</p>", ", nas linhas: ");
	mens[6] = new mensDetail(0, 0, "Ocorrência da propriedade 'blink'", "<span>Recomendação 14:</span><h4>Não incluir situações com intermitência de tela.</h4><p>Não devem ser utilizados efeitos visuais piscantes, intermitentes ou cintilantes. Em pessoas com epilepsia fotosensitiva, o cintilar ou piscar pode desencadear um ataque epilético.</p>", ", nas linhas: ");
	mens[7] = new mensDetail(0, 0, "Ausência do atributo 'lang'", "<span>Recomendação 16:</span><h4>Identificar o idioma principal da página.</h4><p>Deve-se identificar o principal idioma utilizado nos documentos. Essa identificação é feita por meio do atributo lang do HTML e, para documentos XHTML, é utilizado o xml:lang.</p>", ", nas linhas: ");
	mens[8] = new mensDetail(0, 0, "Ausência do elemento 'title'", "<span>Recomendação 17:</span><h4>Oferecer um título descritivo e informativo à página.</h4><p>O título da página deve ser descritivo e informativo, já que essa informação será a primeira lida pelo leitor de tela, quando o usuário acessar a página. O título é informado pela tag &lt;title&gt;.</p>", " "); //ERRO SEM LINHA
	mens[9] = new mensDetail(0, 0, "Ausência do atributo 'alt'", "<span>Recomendação 20:</span><h4>Fornecer alternativa em texto para as imagens do sítio.</h4><p>Deve ser fornecida uma descrição sintética para as imagens da página, utilizando-se o atributo alt. Imagens que não transmitem conteúdo, ou seja, imagens decorativas, devem ser inseridas por CSS.</p><span>Recomendação 21:</span><h4>Fornecer alternativa em texto para as zonas ativas de mapa de imagem.</h4><p>Para mapas de imagem do lado do cliente, devem ser fornecidas descrições através do atributo alt para cada uma das zonas ativas delimitadas pelo atributo coords, ou seja, para cada um dos links que receberá o foco.</p><span>Recomendação 38:</span><h4>Fornecer alternativa em texto para os botões de imagem de formulários.</h4><p>Ao serem utilizados botões do tipo imagem (input type='image'), que servem para o mesmo propósito do botão do tipo submit, deve ser fornecida uma descrição textual para o botão através do atributo alt.</p>", ", nas linhas: ");
	mens[10] = new mensDetail(0, 0, "Ausência do atributo 'coords'", "<span>Recomendação 21:</span><h4>Fornecer alternativa em texto para as zonas ativas de mapa de imagem.</h4><p>Para mapas de imagem do lado do cliente, devem ser fornecidas descrições através do atributo alt para cada uma das zonas ativas delimitadas pelo atributo coords, ou seja, para cada um dos links que receberá o foco.</p>", ", nas linhas: ");
	mens[11] = new mensDetail(0, 0, "Ausência do elemento 'caption' em tabela", "<span>Recomendação 23:</span><h4>Em tabelas, utilizar títulos e resumos de forma apropriada.</h4><p>O título da tabela deve ser definido pelo elemento caption e deve ser o primeiro elemento utilizado após a declaração do elemento table.</p>",", nas linhas: ");
	mens[12] = new mensDetail(0, 0, "Título fora da tabela", "<span>Recomendação 23:</span><h4>Em tabelas, utilizar títulos e resumos de forma apropriada.</h4><p>O título da tabela deve ser definido pelo elemento caption e deve ser o primeiro elemento utilizado após a declaração do elemento table.</p>", ", nas linhas: ");
	mens[13] = new mensDetail(0, 0, "Ausência do elemento 'form'", "<span>Item 3.5 do e-MAG</span><h4>Apresentação de formulário</h4><p> Sempre utilizar a tag form, mesmo que o formulário possua apenas um elemento, como é o caso de uma caixa para pesquisa.</p>", ", nas linhas: ");
	mens[14] = new mensDetail(0, 0, "Elemento descontinuado pela W3C", "<span>Item 3.8 do e-MAG</span><h4>Elementos que não devem ser utilizados.</h4><p>Elementos considerados depreciados pelo W3C, como frame, applet, blink, marquee, basefont, center, dir, align, font, isindex, menu, strike, u, etc.</p>", ", nas linhas: ");
	mens[15] = new mensDetail(0, 0, "Atributo 'lang' sem valor", "<span>Recomendação 16:</span><h4>Identificar o idioma principal da página.</h4><p>Deve-se identificar o principal idioma utilizado nos documentos. Essa identificação é feita por meio do atributo lang do HTML e, para documentos XHTML, é utilizado o xml:lang.</p>", ", nas linhas: ");
	mens[16] = new mensDetail(0, 0, "Atributo 'alt' sem valor", "<span>Recomendação 20:</span><h4>Fornecer alternativa em texto para as imagens do sítio.</h4><p>Deve ser fornecida uma descrição sintética para as imagens da página, utilizando-se o atributo alt. Imagens que não transmitem conteúdo, ou seja, imagens decorativas, devem ser inseridas por CSS.</p>", ", nas linhas: ");
	mens[17] = new mensDetail(0, 0, "Atributo 'coords' sem valor", "<span>Recomendação 21:</span><h4>Fornecer alternativa em texto para as zonas ativas de mapa de imagem.</h4><p>Para mapas de imagem do lado do cliente, devem ser fornecidas descrições através do atributo alt para cada uma das zonas ativas delimitadas pelo atributo coords, ou seja, para cada um dos links que receberá o foco.</p>", ", nas linhas: ");
	mens[18] = new mensDetail(0, 0, "Ausência do atributo 'summary' em tabela", "<span>Recomendação 23:</span><h4>Em tabelas, utilizar títulos e resumos de forma apropriada.</h4><p>Em casos de tabelas extensas, deve ser fornecido um resumo de seus dados através do atributo summary que deve ser declarado no elemento table.</p>", ", nas linhas: ");
	mens[19] = new mensDetail(0, 0, "Atributo 'summary' sem valor", "<span>Recomendação 23:</span><h4>Em tabelas, utilizar títulos e resumos de forma apropriada.</h4><p>Em casos de tabelas extensas, deve ser fornecido um resumo de seus dados através do atributo summary que deve ser declarado no elemento table.</p>", ", nas linhas: ");
	mens[20] = new mensDetail(0, 0, "Ausência de fieldset", "<span>Recomendação 44:</span><h4>Agrupar campos de formulário.</h4><p>Deverão ser agrupados os controles de formulário utilizando-se o elemento fieldset. Para cada fieldset, é possível fornecer uma legenda que explica claramente o propósito ou natureza dos agrupamentos.</p>", ", nas linhas: ");
	mens[21] = new mensDetail(0, 0, "Valor do atributo 'accesskey' deve ser um número ao invés de outro caracter", "<span>Recomendação 6:</span><h4>Fornecer âncoras para ir direto a um bloco de conteúdo.</h4><p>Para facilitar a utilização das âncoras, podem ser disponibilizados atalhos por teclado, utilizando o atributo accesskey. É recomendado o uso de números para não entrar em conflito com os leitores de tela que utilizam letras em seus atalhos.</p>", ", nas linhas: ");
	mens[22] = new mensDetail(0, 0, "Ausência de 'legend' no fieldset", "<span>Recomendação 44:</span><h4>Agrupar campos de formulário.</h4><p>Deverão ser agrupados os controles de formulário utilizando-se o elemento fieldset. Para cada fieldset, é possível fornecer uma legenda que explica claramente o propósito ou natureza dos agrupamentos.</p>", ", nas linhas: ");
	mens[23] = new mensDetail(1, 1, "Respeitar os padrões da W3C.", "<span>Recomendação 1:</span><h4>Respeitar os padrões de desenvolvimento Web.</h4><p>É essencial seguir os padrões de desenvolvimento Web, do W3C (World Wide Web Consortium), com o intuito de maximizar a compatibilidade com atuais e futuros agentes de usuário. Por isso, não deixe de submeter seu código à análise pelos validadores da W3C.</p>", "");
	mens[24] = new mensDetail(1, 1, "Redigir código organizado de forma lógica e semântica.", "<span>Recomendação 2:</span><h4>Organizar o código HTML de forma lógica e semântica.</h4><p>Deve ser utilizada marcação semântica adequada para designar cabeçalhos (h1, h2, h3), listas (ul, ol, dl), marcação de código (code), etc. Assim, as páginas poderão ser apresentadas e compreendidas sem recursos de estilização.</p>", "");
	mens[25] = new mensDetail(1, 1, "Possibilitar navegação via teclado.", "<span>Recomendação 5:</span><h4>Disponibilizar todas as funções da página via teclado.</h4><p>As funções da página deverão estar disponíveis quando for utilizado apenas o teclado. O foco também não deverá estar bloqueado ou fixado em um elemento para que o usuário possa mover-se por todos os elementos via teclado.</p>", "");
	mens[26] = new mensDetail(1, 1, "Fornecer links de atalho (skip links).", "<span>Recomendação 6:</span><h4>Fornecer âncoras para ir direto a um bloco de conteúdo.</h4><p>Devem ser fornecidas âncoras, em lugares estratégicos da página, que apontem para links relevantes na mesma página. Recomenda-se fornecer atalhos para o menu principal, para o conteúdo e para a caixa de pesquisa.</p>", "");
	mens[27] = new mensDetail(1, 0, "Prezar pelo método de desenvolvimento tableless.", "<span>Recomendação 7:</span><h4>Não utilizar tabelas para diagramação.</h4><p>Tabelas devem ser utilizadas apenas para dados tabulares e não para efeitos de disposição dos elementos na página. Para este fim, utilize folhas de estilo.</p>", "");
	mens[28] = new mensDetail(1, 0, "Separar links adjacentes.", "<span>Recomendação 8:</span><h4>Separar links adjacentes.</h4><p>Links adjacentes devem ser separados por mais do que simples espaços. É recomendado o uso de listas, onde cada elemento dentro da lista é um link. Pode-se utilizar vírgulas ou parênteses para separar links em um parágrafo.</p>", "");
	mens[29] = new mensDetail(1, 1, "Possibilitar alteração de limites de tempo.", "<span>Recomendação 13:</span><h4>Fornecer alternativa para modificar limite de tempo.</h4><p>Em uma página onde há limite de tempo para realizar uma tarefa deve haver a opção de desligar, ajustar ou prolongar esse limite, a menos que esse limite de tempo seja absolutamente necessário.</p>", "");
	mens[30] = new mensDetail(1, 0, "Não incluir situações com intermitência de tela.", "<span>Recomendação 14:</span><h4>Não incluir situações com intermitência de tela.</h4><p>Não devem ser utilizados efeitos visuais piscantes, intermitentes ou cintilantes. A exigência dessa diretriz aplica-se também para propaganda de terceiros inserida na página.</p>", "");
	mens[31] = new mensDetail(1, 0, "Controlar conteúdo com movimentos.", "<span>Recomendação 15:</span><h4>Assegurar o controle do usuário sobre as alterações temporais do conteúdo.</h4><p>Conteúdos com movimento, rolagens ou animações não devem ser disparados sem o controle do usuário. Além disso, o usuário deve ser capaz de parar e reiniciar conteúdos que se movem, sem exceção.</p>", "");
	mens[32] = new mensDetail(1, 1, "Fornecer localização do usuário em meio às páginas navegadas.", "<span>Recomendação 18:</span><h4>Disponibilizar informação sobre a localização do usuário na página.</h4><p>Deverá ser fornecido um mecanismo que permita ao usuário orientar-se dentro de um conjunto de páginas, permitindo que ele saiba onde está no momento. Para isso podem ser utilizadas 'migalhas de pão' (breadcrumbs).</p>", "");
	mens[33] = new mensDetail(1, 0, "Descrever bem os links da página.", "<span>Recomendação 19:</span><h4>Descrever links clara e sucintamente.</h4><p>O texto do link deve fazer sentido mesmo quando isolado do contexto da página e deve-se identificar claramente seu destino. Não é recomendada a utilização de links do tipo 'clique aqui' pois não faz sentido fora do contexto.</p>", "");
	mens[34] = new mensDetail(1, 1, "Utilizar documentos em formatos acessíveis.", "<span>Recomendação 22:</span><h4>Disponibilizar documentos em formatos acessíveis.</h4><p>Os documentos devem ser disponibilizados preferencialmente em HTML, ou mesmo no formato ODF, tomando-se os cuidados para que sejam acessíveis.  Ao utilizar PDF, deverá ser fornecida uma alternativa em HTML ou ODF. É necessário, também, informar a extensão e o tamanho do arquivo no próprio texto do link.</p>", "");
	mens[35] = new mensDetail(1, 0, "Associar células de tabelas.", "<span>Recomendação 24:</span><h4>Associar células de dados às células de cabeçalho em uma tabela.</h4><p>Em tabelas de dados simples, deve-se utilizar &lt;th&gt; para cabeçalhos e &lt;td&gt; para células de dados. Deve-se utilizar os elementos thead, tbody e tfoot, com exceção de quando a tabela possuir apenas o corpo, sem ter seções de cabeçalho e rodapé. Para tabelas mais complexas, é necessário associar células de dados com células de cabeçalho utilizando os elementos id/headers ou scope/col.</p>", "");
	mens[36] = new mensDetail(1, 1, "Redigir conteúdo de fácil leitura e compreensão.", "<span>Recomendação 25:</span><h4>Garantir a leitura e compreensão das informações.</h4><p>O texto de um sítio deve ser de fácil leitura e compreensão. Quando o texto exigir uma capacidade de leitura mais avançada, deve ser disponibilizado informações suplementares que expliquem ou ilustrem conteúdo principal.</p>", "");
	mens[37] = new mensDetail(1, 1, "Explicar siglas, abreviaturas e palavras incomuns.", "<span>Recomendação 26:</span><h4>Disponibilizar uma explicação para siglas, abreviaturas e palavras incomuns.</h4><p>Deve estar disponível uma explicação que identifique a forma completa ou o significado das abreviaturas e siglas. Para isso, pode ser utilizada o elemento &lt;abbr&gt;.</p>", "");
	mens[38] = new mensDetail(1, 1, "Identificar conteúdo de diferentes idiomas.", "<span>Recomendação 27:</span><h4>Informar mudança de idioma no conteúdo.</h4><p>Deve-se identificar pelo atributo lang se algum elemento da página possuir conteúdo em um idioma diferente do principal. Essa recomendação não se aplica para nomes próprios ou termos técnicos que sejam compreendidos no contexto.</p>", "");
	mens[39] = new mensDetail(1, 1, "Fornecer contraste entre plano de fundo e primeiro plano.", "<span>Recomendação 28:</span><h4>Oferecer contraste mínimo entre plano de fundo e primeiro plano.</h4><p>As cores entre esses planos deverão ser suficientemente contrastantes para que possam ser visualizadas, também, por pessoas com baixa visão, com cromodeficiências ou que utilizam monitores de vídeo monocromático. Não deverão ser utilizadas imagens atrás do texto (background), pois acabam por dificultar a leitura e desviar a atenção do usuário.</p>", "");
	mens[40] = new mensDetail(1, 1, "Não diferenciar conteúdo apenas por características sensoriais.", "<span>Recomendação 29:</span><h4>Não utilizar apenas cor ou outras características sensoriais para diferenciar elementos.</h4><p>Características sensoriais como cor, forma, tamanho, localização visual ou som não devem ser utilizadas como o único meio para transmitir informações, indicar uma ação, pedir uma resposta ao usuário ou distinguir um elemento visual.</p>", "");
	mens[41] = new mensDetail(1, 1, "Permitir redimensionamento sem perda de funcionalidade.", "<span>Recomendação 30:</span><h4>Permitir redimensionamento de texto sem perda de funcionalidade.</h4><p>A página deve continuar legível e funcional quando redimensionada para até 200%. Assim, é preciso garantir que, quando a página for redimensionada, não ocorram sobreposições de texto nem o aparecimento de uma barra horizontal.</p>", "");
	mens[42] = new mensDetail(1, 1, "Dividir áreas de informação e manter guidelines.", "<span>Recomendação 31:</span><h4>Dividir as áreas de informação.</h4><p>As divisões mais comuns são 'topo', 'conteúdo', 'menu' e 'rodapé'. Nas páginas internas deve-se procurar manter uma mesma divisão para que o usuário se familiarize mais rapidamente com a estrutura do sítio.</p>", "");
	mens[43] = new mensDetail(1, 1, "Evidenciar elemento em foco.", "<span>Recomendação 32:</span><h4>Possibilitar que o elemento com foco seja visualmente evidente.</h4><p>A área que recebe o foco pelo teclado deve ser claramente marcada e clicável. Por padrão, links e elementos de formulário já apresentam essa borda que pode ser modificada via CSS, mas não deverá ser removida.</p>", "");
	mens[44] = new mensDetail(1, 0, "Fornecer alternativa para vídeo.", "<span>Recomendação 33:</span><h4>Fornecer alternativa para vídeo.</h4><p>Deve haver uma alternativa sonora ou textual para vídeos que não incluem faixas de áudio. Para vídeos que contêm áudio falado e no idioma natural da página, devem ser fornecidas legendas.</p>", "");
	mens[45] = new mensDetail(1, 0, "Fornecer alternativa para áudio.", "<span>Recomendação 34:</span><h4>Fornecer alternativa para áudio.</h4><p>Áudio gravado deve possuir uma transcrição descritiva. Também é desejável a alternativa em Libras.</p>", "");
	mens[46] = new mensDetail(1, 0, "Fornecer audiodescrição para vídeos.", "<span>Recomendação 35:</span><h4>Oferecer audiodescrição para vídeo pré-gravado.</h4><p>Vídeos que transmitem conteúdo visual que não está disponível na faixa de áudio devem possuir uma audiodescrição. Apresentada nos espaços entre os diálogos, a audiodescrição é a descrição das informações apresentadas visualmente.</p>", "");
	mens[47] = new mensDetail(1, 0, "Fornecer controle de áudio.", "<span>Recomendação 36:</span><h4>Fornecer controle de áudio para som.</h4><p>Deve ser fornecido um mecanismo para parar, pausar, silenciar ou ajustar o volume de qualquer som que se reproduza na página.</p>", "");
	mens[48] = new mensDetail(1, 0, "Fornecer controle de animação.", "<span>Recomendação 37:</span><h4>Fornecer controle de animação.</h4><p>Para qualquer animação que inicie automaticamente na página devem ser fornecidos mecanismos para que o usuário possa pausar, parar ou ocultar tal animação.</p>", "");
	mens[49] = new mensDetail(1, 0, "Associar etiquetas aos seus campos.", "<span>Recomendação 39:</span><h4>Associar etiquetas aos seus campos.</h4><p>As etiquetas de texto (label) devem estar associadas aos seus campos (input) correspondentes no formulário, através dos atributos for do label e id do input, os quais deverão ter o mesmo valor.</p>", "");
	mens[50] = new mensDetail(1, 0, "Desenvolver formulários visando uma ordem lógica de navegação.", "<span>Recomendação 40:</span><h4>Estabelecer uma ordem lógica de navegação.</h4><p>Os elementos do formulário devem ser distribuídos corretamente através do código HTML, criando, assim, uma sequência lógica de navegação.</p>", "");
	mens[51] = new mensDetail(1, 0, "Evitar alterações automáticas no contexto.", "<span>Recomendação 41:</span><h4>Não provocar automaticamente alteração no contexto.</h4><p>As mudanças devem ocorrer através do acionamento de um botão. Quando um elemento de formulário receber o foco, não deve ser iniciada uma mudança automática na página.</p>", "");
	mens[52] = new mensDetail(1, 0, "Fornecer sugestão de preenchimento em campos de entrada.", "<span>Recomendação 42:</span><h4>Fornecer instruções para entrada de dados.</h4><p>Para conteúdo que exigir entrada de dados por parte do usuário, devem ser fornecidas, quando necessário, instruções de preenchimento juntamente com as etiquetas (label).</p>", "");
	mens[53] = new mensDetail(1, 0, "Identificar e descrever erros em dados de entrada.", "<span>Recomendação 43:</span><h4>Identificar e descrever erros de entrada de dados.</h4><p>Quando um erro de entrada de dados for automaticamente detectado, o item que apresenta erro deve ser identificado e descrito ao usuário por texto.</p>", "");
	mens[54] = new mensDetail(1, 0, "Fornecer CAPTCHA em formulário.", "<span>Recomendação 45:</span><h4>Fornecer CAPTCHA humano.</h4><p>O CAPTCHA (teste interativo humano, completamente automatizado, para distinguir computadores de seres humanos) deverá ser utilizado apenas quando estritamente necessário. Quando utilizado, deverá ser fornecido em forma de uma pergunta não seja de difícil resolução, permitindo que a mesma possa ser respondida por pessoas de variadas culturas e níveis de instrução.</p>", "");
	mens[55] = new mensDetail(2, 0, "", "", "");
	
	// Inicializa array flag para controle de erros
	codErr = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);	
	
	// Inicializa array flag auxiliar
	//arrFlag[3] - Sem uso 
	arrFlag = new Array(0,0,0,0,-579,0,0,0,0,0,0,0,0,0,0);
	
	first = 1;
	firstCtag = 1;
	var HTMLParser = this.HTMLParser = function( html, handler ) {

		var index, chars, match, stack = [], last = html, errbool = 0, errlin = -1;

		// Total de linhas do código HTML
		var htmlaux = html.split("\n");
		var rows = htmlaux.length;

		stack.last = function(){
			return this[ this.length - 1 ];
		};

		try{
			while(html){
				chars = true;

				// Para ter certeza de não estar em um elemento 'style'
				if ( !stack.last() || !special[ stack.last() ] ) {

					// Comentário
					if ( html.indexOf("<!--") == 0 ) {
						index = html.indexOf("-->");

						if ( index >= 0 ) {
							if ( handler.comment )
								handler.comment( html.substring( 4, index ) );
							html = html.substring( index + 3 );
							chars = false;
						}

					// Doctype
					} else if ( html.indexOf("<!") == 0 ) {
						index = html.indexOf(">");
		
						if ( index >= 0 ) {
							if ( handler.doctype )
								handler.doctype( html.substring( 2, index ) );
							html = html.substring( index + 1 );
							chars = false;
						}

					// Tag de fechamento
					} else if ( html.indexOf("</") == 0 ) {
						match = html.match( endTag );
						
						// Esquece última tag lida
						arrFlag[14] = " "; 
						
						if ( match ) {
							html = html.substring( match[0].length );
							match[0].replace( endTag, parseEndTag );
							chars = false;
						}

					// Tag de abertura
					} else if ( html.indexOf("<") == 0 ) {
						match = html.match( startTag );
						
						// Armazena última tag lida
						arrFlag[14] = match[1]; 
						
						if ( match ) {
							html = html.substring( match[0].length );
							match[0].replace( startTag, parseStartTag );
							chars = false;
						}
					}
					
					if ( chars ) {
						// Se a última tag lida foi <script> ignora seu conteúdo
						// caso contrário, procura início de nova tag
						arrFlag[14] == "script" ? index = html.indexOf("</script>") : index = html.indexOf("<");
						
						// Esquece última tag lida
						arrFlag[14] = " "; 
						
						var text = index < 0 ? html : html.substring( 0, index );
						html = index < 0 ? "" : html.substring( index );

						if ( handler.chars )
							handler.chars( text );
					}

				} else {
					html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){
						text = text.replace(/<!--(.*?)-->/g, "$1")
							.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

						if ( handler.chars )
							handler.chars( text );

						return "";
					});

					parseEndTag( "", stack.last() );
				}

				if ( html == last )
					throw "Parse Error: " + html;
				last = html;
			}
		} catch(err){
			// Total de linhas restantes no código HTML
			var htmlleft = html.split("\n");
			var rowsleft = htmlleft.length;
			// Linha onde ocorreu o erro: rowsright + 1
			var rowsocc = (rows - rowsleft) + 1;

			mens[0].ocorrencia = 1; 
			mens[0].linha = mens[0].linha + rowsocc;
		}
		
		
		// Tratamento de erro: limpa tags remanecentes
		parseEndTag();
		
		// Identifica erros sem linhas de ocorrência
		errorWithoutRow();

		function parseStartTag( tag, tagName, rest, unary ) {
			if ( block[ tagName ] ) {
				while ( stack.last() && inline[ stack.last() ] ) {
					parseEndTag( "", stack.last() );
				}	
			}

			if ( closeSelf[ tagName ] && stack.last() == tagName ) {
				parseEndTag( "", tagName );
			}

			unary = empty[ tagName ] || !!unary;

			if ( !unary ){ stack.push( tagName ); }

			// Sinaliza a presença de um elemento do tipo imagem (type="image")
			arrFlag[9]=0;
			
			if ( handler.start ) {
				var attrs = [];
				rest.replace(attr, function(match, name) {
					var value = arguments[2] ? arguments[2] :
						arguments[3] ? arguments[3] :
						arguments[4] ? arguments[4] :
						fillAttrs[name] ? name : "";

						detectaErroAttr(name, value);

					attrs.push({
						name: name,
						value: value,
						escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
					});
				});	
				
				detectaErroElem(tagName);

				if(codErr[1]){
					var occurrence = errorRow(rows,html);
					mens[1].ocorrencia++; errbool = 1; errlin = occurrence;
					mens[1].linha= mens[1].linha + occurrence + ", ";
				}
				else if(codErr[2]){
					var occurrence = errorRow(rows,html);
					mens[2].ocorrencia++; errbool=1; errlin = occurrence;
					mens[2].linha= mens[2].linha + occurrence + ", ";
				}
				else if(codErr[3]){
					var occurrence = errorRow(rows,html);
					mens[3].ocorrencia++; errbool=1; errlin = occurrence;
					mens[3].linha= mens[3].linha + occurrence + ", ";
				}				
				else if(codErr[5]){
					var occurrence = errorRow(rows,html);
					mens[5].ocorrencia++; errbool=1; errlin = occurrence;
					mens[5].linha= mens[5].linha + occurrence + ", ";
				}
				else if(codErr[6]){
					var occurrence = errorRow(rows,html);
					mens[6].ocorrencia++; errbool=1; errlin = occurrence;
					mens[6].linha= mens[6].linha + occurrence + ", ";
				}
				else if((tagName.toLowerCase() == "html")&&(!codErr[7])){
					var occurrence = errorRow(rows,html);
					mens[7].ocorrencia++; errbool=1; errlin = occurrence;
					mens[7].linha= mens[7].linha + occurrence + ", ";
				}
				else if(tagName.toLowerCase() == "img"){
					if(!codErr[9]){					
						var occurrence = errorRow(rows,html);
						mens[9].ocorrencia++; errbool=1; errlin = occurrence;
						mens[9].linha= mens[9].linha + occurrence + ", ";	
					}
					if(codErr[16]){
						var occurrence = errorRow(rows,html);
						mens[16].ocorrencia++; errbool=1; errlin = occurrence;
						mens[16].linha= mens[16].linha + occurrence + ", ";
					}
				}
				else if(tagName.toLowerCase() == "area"){
					if(!codErr[9]){
						var occurrence = errorRow(rows,html);
						mens[9].ocorrencia++; errbool=1; errlin = occurrence;
						mens[9].linha= mens[9].linha + occurrence + ", ";
					}	
					if(!codErr[10]){
						var occurrence = errorRow(rows,html);
						mens[10].ocorrencia++; errbool=1; errlin = occurrence;
						mens[10].linha= mens[10].linha + occurrence + ", ";
					}
					if(codErr[16]){
						var occurrence = errorRow(rows,html);
						mens[16].ocorrencia++; errbool=1; errlin = occurrence;
						mens[16].linha= mens[16].linha + occurrence + ", ";
					}					
				}	
				else if(arrFlag[9] == 1){
					if(!codErr[9]){
						var occurrence = errorRow(rows,html);
						mens[9].ocorrencia++; errbool=1; errlin = occurrence;
						mens[9].linha= mens[9].linha + occurrence + ", ";	
					}
					if(codErr[16]){
						var occurrence = errorRow(rows,html);
						mens[16].ocorrencia++; errbool=1; errlin = occurrence;
						mens[16].linha= mens[16].linha + occurrence + ", ";
					}
				}				
				else if(codErr[11]){
					var occurrence = arrFlag[13];
					mens[11].ocorrencia++; errbool=1; errlin = occurrence;
					mens[11].linha= mens[11].linha + occurrence + ", ";
				}
				else if(codErr[12]){
					var occurrence = errorRow(rows,html);
					mens[12].ocorrencia++; errbool=1; errlin = occurrence;
					mens[12].linha= mens[12].linha + occurrence + ", ";
				}
				else if(codErr[13]){
					var occurrence = errorRow(rows,html);
					mens[13].ocorrencia++; errbool=1; errlin = occurrence;
					mens[13].linha= mens[13].linha + occurrence + ", ";
				}
				else if(codErr[14]){
					var occurrence = errorRow(rows,html);
					mens[14].ocorrencia++; errbool=1; errlin = occurrence;
					mens[14].linha= mens[14].linha + occurrence + ", ";
				}
				else if(codErr[15]){
					var occurrence = errorRow(rows,html);
					mens[15].ocorrencia++; errbool=1; errlin = occurrence;
					mens[15].linha= mens[15].linha + occurrence + ", ";
				}
				else if(codErr[17]){
					var occurrence = errorRow(rows,html);
					mens[17].ocorrencia++; errbool=1; errlin = occurrence;
					mens[17].linha= mens[17].linha + occurrence + ", ";
				}
				else if((tagName.toLowerCase() == "table")&&(!codErr[18])){
					var occurrence = errorRow(rows,html);
					mens[18].ocorrencia++; errbool=1; errlin = occurrence;
					mens[18].linha= mens[18].linha + occurrence + ", ";
				}
				else if(codErr[19]){
					var occurrence = errorRow(rows,html);
					mens[19].ocorrencia++; errbool=1; errlin = occurrence;
					mens[19].linha= mens[19].linha + occurrence + ", ";
				}
				else if(codErr[20]){
					var occurrence = arrFlag[11];
					mens[20].ocorrencia++; errbool=1; errlin = occurrence;
					mens[20].linha= mens[20].linha + occurrence + ", ";
				}
				else if(codErr[21]){
					var occurrence = errorRow(rows,html);
					mens[21].ocorrencia++; errbool=1; errlin = occurrence;
					mens[21].linha= mens[21].linha + occurrence + ", ";
				}
				else if(codErr[22]){
					var occurrence = arrFlag[12];
					mens[22].ocorrencia++; errbool=1; errlin = occurrence;
					mens[22].linha= mens[22].linha + occurrence + ", ";
				}

				// Sinaliza a existência do elemento 'table' sem elemento 'caption'
				if(arrFlag[2]) 
					codErr[11] = 1; 
				
				// Salva a ocorrência do erro 8 antes de reinicializar o vetor
				var aux = codErr[8]; 
				
				// Prototipo para gerar versão JSON do código ////////////////////// ///////////////////
				if ( !unary ){					
					if(first){ 
						mens[55].detalhe += '{ "name" : "'+ tagName +'" , "error" : "'+ errbool +'" , "row" : "'+ errlin +'" ';
						first = 0; 
						firstCtag = 1;
					} else { 
						mens[55].detalhe += ', "children": [ { "name" : "'+ tagName +'" , "error" : "'+ errbool +'" , "row" : "'+ errlin +'" ';
					}					
				} else {
					if(first){ 
						mens[55].detalhe += '{ "name" : "'+ tagName +'" , "error" : "'+ errbool +'" , "row" : "'+ errlin +'" }, ';
					} else { 						
						mens[55].detalhe += ', "children": [ { "name" : "'+ tagName +'" , "error" : "'+ errbool +'" , "row" : "'+ errlin +'" }, ';
						firstCtag = 0; first = 1;
					}
				}
				errbool = 0;
				errlin = -1;
				//////////////////////////////////////////////////////////////////// ///////////////////
			
				codErr=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
				codErr[8] = aux;
				
				if ( handler.start )
					handler.start( tagName, attrs, unary );
			}
		}

		function parseEndTag( tag, tagName ) {
			// Se não for fornecido nome de nenhuma tag
			if ( !tagName )
				var pos = 0;

			// Encontra o correspondente de fechamento do mesmo tipo da tag aberta 
			else
				for ( var pos = stack.length - 1; pos >= 0; pos-- )
					if ( stack[ pos ] == tagName )
						break;
						
			if ( pos >= 0 ) {
				
				// Erros identificados quando encontrados os correspondentes de fechamento
				if(tagName == "form"){				
					arrFlag[0]=0;
					
					if(arrFlag[1] == 0){
						// Registra erro caso não exista nenhum 'fieldset' dentro do form
						codErr[20] = 1;
						arrFlag[11] = errorRow(rows,html);
					}else{
						arrFlag[1] = 0;
					}
					
				}else if((tagName == "fieldset")&&(arrFlag[8])){
					// Registra erro caso não exista 'legend' dentro do 'fieldset'
					arrFlag[8] = 0; 
					codErr[22] = 1;
					arrFlag[12] = errorRow(rows,html);
					
				}else if((tagName == "table")&&(arrFlag[2])){ 				
					// Registra erro caso não exista 'caption' dentro da tabela
					arrFlag[2]=0; 
					codErr[11]=1;
					arrFlag[13] = errorRow(rows,html);
					
				}
				
				// Fecha todos os elementos abertos do topo da pilha
				for ( var i = stack.length - 1; i >= pos; i-- )
					if ( handler.end )
						handler.end( stack[ i ] );
				
				// Remove os elementos abertos da pilha
				stack.length = pos;
			}
			
			// Prototipo para gerar versão JSON do código //////////////////////
			if(firstCtag){ mens[55].detalhe += '}, '; firstCtag = 0; first = 1;}
			else{ 
				var numaux = mens[55].detalhe.lastIndexOf(", ");
				mens[55].detalhe = mens[55].detalhe.slice(0,numaux);
				mens[55].detalhe += ']}, ';
			}
			////////////////////////////////////////////////////////////////////
		}
	};
	
	/**
	 * Valida HTML.
	 * Chama a função HTMLParser para análise do código HTML
	 * e retorna array de erros identificados.
	 */
	this.ValidaHTML = function( html ) {
		var results = "";
		
		HTMLParser(html, {
			start: function( tag, attrs, unary ) {
				results += "<" + tag;
		
				for ( var i = 0; i < attrs.length; i++ )
					results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
		
				results += (unary ? "/" : "") + ">";
			},
			end: function( tag ) {
				results += "</" + tag + ">";
			},
			chars: function( text ) {
				results += text;
			},
			comment: function( text ) {
				results += "<!--" + text + "-->";
			},
			doctype: function( text ) {
				results += "<!" + text + ">";
			}
		});
		
		// Prototipo para gerar versão JSON do código //////////////////////
		var auxgamb = mens[55].detalhe.lastIndexOf(']}, ');
		mens[55].detalhe = mens[55].detalhe.slice(0,auxgamb);
		////////////////////////////////////////////////////////////////////
		return mens;
	};
	
	/**
	 * Cria map.
	 * Recebe um conjunto de valores e cria um objeto
	 */
	function makeMap(str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[i] ] = true;
		return obj;
	};	
	
	/**
	 * Detalhes da mensagem.
	 * Armazena tipo de mensagem (se erro ou alerta), quantidade 
	 * de ocorrências, descrição e linhas onde ocorreram os erros.
	 * @author Victor Adriel 
	 */
	function mensDetail(tip, occ, desc, det, row){
		this.tipo = tip; 
		this.ocorrencia = occ; 
		this.descricao = desc;
		this.detalhe = det;
		this.linha = row;
	};
	
	/**
	 * Linha de ocorrência do erro.
	 * Cálcula diferença entre quantidade de quebras de linha 
	 * restantes na pilha e a quantidade de quebras inicial
	 * @author Victor Adriel 
	 */
	function errorRow(rows,html){
		var htmlauxX = html.split("\n");
		var rowsSoFar = htmlauxX.length;
		rowsSoFar = rows - rowsSoFar + 1;
		return rowsSoFar;
	};
	
	/**
	 * Erros sem linha de ocorrência.
	 * Registra erro em elementos que deveriam estar na página, 
	 * mas não são esperados em uma linha específica.
	 * @author Victor Adriel 
	 */
	function errorWithoutRow(){
		if(!codErr[8]){
			mens[8].ocorrencia++;
		}
		if((arrFlag[7] == 1)&&(arrFlag[10] == 0)){
			mens[4].ocorrencia++;
		}
	};
	
	/**
	 * Erros relacionados a atributos/valores.
	 * Identifica erros causados pela existência imprópria ou 
	 * ausência de atributos e/ou valores de atributos segundo o e-MAG v3.0.
	 * @author Victor Adriel 
	 */
	function detectaErroAttr(name, value){
		switch (name.toLowerCase()){
		case "alt": 
			codErr[9] = 1;
			if((value=="")||(value.match(/^\s+$/))) codErr[16] = 1;
			break;
		case "type": 
			if(value=="image") arrFlag[9] = 1;
			break;
		case "summary": 
			codErr[18] = 1;
			if((value=="")||(value.match(/^\s+$/))) codErr[19] = 1;
			break;
		case "target": 
			if(value.toLowerCase() == "_blank") 
				codErr[3] = 1;
			break;
		case "style": 
			if(value.match(/[Bb][Ll][Ii][Nn][Kk]/))
				codErr[6] = 1;
			break;
		case "src": 
			if(value.match(/\.gif/))
				mens[30].ocorrencia++;
			break;
		case "lang": 
		case "xml:lang": 
			codErr[7] = 1;
			if((value=="")||(value.match(/^\s+$/))) codErr[15] = 1;
			break;
		case "coords": 
			codErr[10] = 1;
			if((value=="")||(value.match(/^\s+$/))) codErr[17] = 1;
			break;
		case "accesskey": 
			if((value=="")||(value.match(/^\D+$/))) codErr[21] = 1;
			break;
		case "tabindex":
			if(arrFlag[4]==-579) arrFlag[4] = value;
			else{
				arrFlag[5] = value;
				if(arrFlag[4] > arrFlag[5]) codErr[2] = 1;
				else{arrFlag[4] = arrFlag[5];}
			}
			break;
		case "http-equiv": 
			if(value.toLowerCase() == "refresh") 
				codErr[5] = 1;
			break;
		}
	};
	
	/**
	 * Erros relacionados a elementos.
	 * Identifica erros causados pela existência imprópria ou 
	 * ausência de elementos segundo o e-MAG v3.0.
	 * @author Victor Adriel 
	 */
	function detectaErroElem(tagName){
		switch (tagName.toLowerCase()){
		case "title": 
			codErr[8] = 1;
			break;
		case "a": 
			mens[28].ocorrencia++;
			mens[33].ocorrencia++;
			break;				
		case "input": 
		case "textarea": 
		case "button": 
		case "option": 
		case "select": 
		case "label": 
		case "optgroup": 
			if(arrFlag[0] == 0)
				codErr[13] = 1;
			break;
		case "form": 
			arrFlag[0] = 1;
			mens[49].ocorrencia++;
			mens[50].ocorrencia++;
			mens[51].ocorrencia++;
			mens[52].ocorrencia++;
			mens[53].ocorrencia++;
			mens[54].ocorrencia++;
			break;
		case "fieldset": 
			arrFlag[1] = 1;	
			arrFlag[8] = 1;			
			break;
		case "legend":
			if(arrFlag[8]) arrFlag[8]=0;
			break;
		case "h1":
			if(arrFlag[6]) codErr[1] = 1;
			else arrFlag[6]=1;
			break;
		case "basefont": 
		case "big": 
		case "center": 
		case "font": 
		case "s": 
		case "strike": 
		case "tt": 
		case "u": 
		case "frame": 
		case "frameset": 
		case "noframes": 
		case "acronym": 
		case "applet": 
		case "isindex": 
		case "dir": 
			codErr[14] = 1;
			break;
		case "script":
			arrFlag[7] = 1;
			mens[31].ocorrencia++;
			mens[48].ocorrencia++;
			break;
		case "noscript":
			arrFlag[10] = 1;
			break;
		case "table":
			arrFlag[2]=1;
			mens[27].ocorrencia++;
			mens[35].ocorrencia++;
			break;
		case "object":
		case "embed":
		case "video":
		case "audio":
			mens[30].ocorrencia++;
			mens[31].ocorrencia++;
			mens[44].ocorrencia++;
			mens[45].ocorrencia++;
			mens[46].ocorrencia++;
			mens[47].ocorrencia++;
			mens[48].ocorrencia++;
			break;
		case "caption":
			if(arrFlag[2]) arrFlag[2]=0;
			else codErr[12] = 1; 
			break;
		}
	};
})();
