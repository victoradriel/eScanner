/**
 * HTML Parser
 * Recebe um c�digo HTML como par�metro e identifica a ocorr�ncia 
 * de erros e alerta poss�veis erros segundo o e-MAG v3.0.
 * 
 * Adapta��o do HTML Parser feito por John Resig
 * http://ejohn.org/files/htmlparser.js
 * C�digo original de Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * @author Victor Adriel de J. Oliveira
 */

(function(){

	// Express�es regulares para o parsing de tags e attributes
	var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+[-:]?\w*[-:]?\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
		attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
		
	// Elementos vazios - HTML 4.01
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

	// Elementos de bloco - HTML 4.01
	var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

	// Elementos inline - HTML 4.01
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

	// Elementos que voc�, intencionalmente, pode deixar abertos
	// (e que feicham a si mesmos)
	var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

	// Atributos que t�m seus valores preenchidos assim: disabled="disabled"
	var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

	// Elementos especiais (pode n�o conter nada) 
	// Na vers�o de John Resig havia o elemento Script.
	var special = makeMap("style");	
	
	// Inicializa array de mensagens (erros/alertas)
	mens = new Array();
	mens[0] = new mensDetail(0, 0, "Variavel para armazenamento de erros no processo de an�lise", "Uso do sistema", ""); // Status 0:SUCCESS / 1:ERROR 
	mens[1] = new mensDetail(0, 0, "M�ltiplas ocorr�ncias do elemento 'H1'", "<span>Recomenda��o 3:</span><h4>Utilizar corretamente os n�veis de cabe�alho.</h4><p>Os n�veis de cabe�alho devem ser utilizados de forma l�gica e sem�ntica para facilitar a leitura e compreens�o. Cada p�gina dever� ter apenas um h1, j� os n�veis do h2 ao h6 poder�o ser utilizados mais de uma vez na p�gina.</p>", ", nas linhas: ");
	mens[2] = new mensDetail(0, 0, "Valor do atributo tabindex menor que anterior", "<span>Recomenda��o 4:</span><h4>Ordenar de forma l�gica e intuitiva a leitura e tabula��o.</h4><p>Deve-se criar o c�digo HTML com uma sequ�ncia l�gica de leitura para percorrer links, controles de formul�rios e objetos. Essa sequ�ncia � determinada pela ordem que se encontra no c�digo HTML. O atributo tabindex somente dever� ser utilizado quando existir real necessidade e deve se evitar uma ordem de tabula��o inconsistente.</p>", ", nas linhas: ");
	mens[3] = new mensDetail(0, 0, "Ocorr�ncia de target='_blank'", "<span>Recomenda��o 9:</span><h4>N�o abrir novas inst�ncias sem a solicita��o do usu�rio.</h4><p>A decis�o de utilizar novas inst�ncias � do cidad�o. Assim, n�o devem ser utilizadas pop-ups ou abertas novas abas e/ou janelas, por exemplo, que n�o tenham sido solicitadas pelo usu�rio. Obs: A fun��o 'alert' do javascript n�o gera um pop-up, mas uma mensagem que pode ser lida por leitores de tela.</p>", ", nas linhas: ");
	mens[4] = new mensDetail(0, 0, "Uso do elemento 'script' sem 'noscript'", "<span>Recomenda��o 10:</span><h4>Garantir que os objetos program�veis sejam acess�veis.</h4><p>O script deve ser desenvolvido tomando-se o cuidado para que seja acess�vel, e o elemento noscript deve ser utilizado para abranger os casos em que scripts n�o s�o suportados.</p>", " "); //ERRO SEM LINHA
	mens[5] = new mensDetail(0, 0, "P�gina sendo recarregada automaticamente", "<span>Recomenda��o 11:</span><h4>N�o criar p�ginas com atualiza��o autom�tica peri�dica.</h4><p>N�o deve ser utilizada a meta tag refresh, nem outra forma de atualiza��o autom�tica. P�ginas que se atualizam automaticamente podem confundir e desorientar os usu�rios, especialmente os que utilizam leitores de tela.</p><span>Recomenda��o 12:</span><h4>N�o utilizar redirecionamento autom�tico de p�ginas.</h4><p>N�o devem ser utilizadas marca��es para redirecionar para uma nova p�gina, como a meta tag refresh. Ao inv�s disso, deve-se configurar o servidor para que o redirecionamento seja transparente para o usu�rio.</p>", ", nas linhas: ");
	mens[6] = new mensDetail(0, 0, "Ocorr�ncia da propriedade 'blink'", "<span>Recomenda��o 14:</span><h4>N�o incluir situa��es com intermit�ncia de tela.</h4><p>N�o devem ser utilizados efeitos visuais piscantes, intermitentes ou cintilantes. Em pessoas com epilepsia fotosensitiva, o cintilar ou piscar pode desencadear um ataque epil�tico.</p>", ", nas linhas: ");
	mens[7] = new mensDetail(0, 0, "Aus�ncia do atributo 'lang'", "<span>Recomenda��o 16:</span><h4>Identificar o idioma principal da p�gina.</h4><p>Deve-se identificar o principal idioma utilizado nos documentos. Essa identifica��o � feita por meio do atributo lang do HTML e, para documentos XHTML, � utilizado o xml:lang.</p>", ", nas linhas: ");
	mens[8] = new mensDetail(0, 0, "Aus�ncia do elemento 'title'", "<span>Recomenda��o 17:</span><h4>Oferecer um t�tulo descritivo e informativo � p�gina.</h4><p>O t�tulo da p�gina deve ser descritivo e informativo, j� que essa informa��o ser� a primeira lida pelo leitor de tela, quando o usu�rio acessar a p�gina. O t�tulo � informado pela tag &lt;title&gt;.</p>", " "); //ERRO SEM LINHA
	mens[9] = new mensDetail(0, 0, "Aus�ncia do atributo 'alt'", "<span>Recomenda��o 20:</span><h4>Fornecer alternativa em texto para as imagens do s�tio.</h4><p>Deve ser fornecida uma descri��o sint�tica para as imagens da p�gina, utilizando-se o atributo alt. Imagens que n�o transmitem conte�do, ou seja, imagens decorativas, devem ser inseridas por CSS.</p><span>Recomenda��o 21:</span><h4>Fornecer alternativa em texto para as zonas ativas de mapa de imagem.</h4><p>Para mapas de imagem do lado do cliente, devem ser fornecidas descri��es atrav�s do atributo alt para cada uma das zonas ativas delimitadas pelo atributo coords, ou seja, para cada um dos links que receber� o foco.</p><span>Recomenda��o 38:</span><h4>Fornecer alternativa em texto para os bot�es de imagem de formul�rios.</h4><p>Ao serem utilizados bot�es do tipo imagem (input type='image'), que servem para o mesmo prop�sito do bot�o do tipo submit, deve ser fornecida uma descri��o textual para o bot�o atrav�s do atributo alt.</p>", ", nas linhas: ");
	mens[10] = new mensDetail(0, 0, "Aus�ncia do atributo 'coords'", "<span>Recomenda��o 21:</span><h4>Fornecer alternativa em texto para as zonas ativas de mapa de imagem.</h4><p>Para mapas de imagem do lado do cliente, devem ser fornecidas descri��es atrav�s do atributo alt para cada uma das zonas ativas delimitadas pelo atributo coords, ou seja, para cada um dos links que receber� o foco.</p>", ", nas linhas: ");
	mens[11] = new mensDetail(0, 0, "Aus�ncia do elemento 'caption' em tabela", "<span>Recomenda��o 23:</span><h4>Em tabelas, utilizar t�tulos e resumos de forma apropriada.</h4><p>O t�tulo da tabela deve ser definido pelo elemento caption e deve ser o primeiro elemento utilizado ap�s a declara��o do elemento table.</p>",", nas linhas: ");
	mens[12] = new mensDetail(0, 0, "T�tulo fora da tabela", "<span>Recomenda��o 23:</span><h4>Em tabelas, utilizar t�tulos e resumos de forma apropriada.</h4><p>O t�tulo da tabela deve ser definido pelo elemento caption e deve ser o primeiro elemento utilizado ap�s a declara��o do elemento table.</p>", ", nas linhas: ");
	mens[13] = new mensDetail(0, 0, "Aus�ncia do elemento 'form'", "<span>Item 3.5 do e-MAG</span><h4>Apresenta��o de formul�rio</h4><p> Sempre utilizar a tag form, mesmo que o formul�rio possua apenas um elemento, como � o caso de uma caixa para pesquisa.</p>", ", nas linhas: ");
	mens[14] = new mensDetail(0, 0, "Elemento descontinuado pela W3C", "<span>Item 3.8 do e-MAG</span><h4>Elementos que n�o devem ser utilizados.</h4><p>Elementos considerados depreciados pelo W3C, como frame, applet, blink, marquee, basefont, center, dir, align, font, isindex, menu, strike, u, etc.</p>", ", nas linhas: ");
	mens[15] = new mensDetail(0, 0, "Atributo 'lang' sem valor", "<span>Recomenda��o 16:</span><h4>Identificar o idioma principal da p�gina.</h4><p>Deve-se identificar o principal idioma utilizado nos documentos. Essa identifica��o � feita por meio do atributo lang do HTML e, para documentos XHTML, � utilizado o xml:lang.</p>", ", nas linhas: ");
	mens[16] = new mensDetail(0, 0, "Atributo 'alt' sem valor", "<span>Recomenda��o 20:</span><h4>Fornecer alternativa em texto para as imagens do s�tio.</h4><p>Deve ser fornecida uma descri��o sint�tica para as imagens da p�gina, utilizando-se o atributo alt. Imagens que n�o transmitem conte�do, ou seja, imagens decorativas, devem ser inseridas por CSS.</p>", ", nas linhas: ");
	mens[17] = new mensDetail(0, 0, "Atributo 'coords' sem valor", "<span>Recomenda��o 21:</span><h4>Fornecer alternativa em texto para as zonas ativas de mapa de imagem.</h4><p>Para mapas de imagem do lado do cliente, devem ser fornecidas descri��es atrav�s do atributo alt para cada uma das zonas ativas delimitadas pelo atributo coords, ou seja, para cada um dos links que receber� o foco.</p>", ", nas linhas: ");
	mens[18] = new mensDetail(0, 0, "Aus�ncia do atributo 'summary' em tabela", "<span>Recomenda��o 23:</span><h4>Em tabelas, utilizar t�tulos e resumos de forma apropriada.</h4><p>Em casos de tabelas extensas, deve ser fornecido um resumo de seus dados atrav�s do atributo summary que deve ser declarado no elemento table.</p>", ", nas linhas: ");
	mens[19] = new mensDetail(0, 0, "Atributo 'summary' sem valor", "<span>Recomenda��o 23:</span><h4>Em tabelas, utilizar t�tulos e resumos de forma apropriada.</h4><p>Em casos de tabelas extensas, deve ser fornecido um resumo de seus dados atrav�s do atributo summary que deve ser declarado no elemento table.</p>", ", nas linhas: ");
	mens[20] = new mensDetail(0, 0, "Aus�ncia de fieldset", "<span>Recomenda��o 44:</span><h4>Agrupar campos de formul�rio.</h4><p>Dever�o ser agrupados os controles de formul�rio utilizando-se o elemento fieldset. Para cada fieldset, � poss�vel fornecer uma legenda que explica claramente o prop�sito ou natureza dos agrupamentos.</p>", ", nas linhas: ");
	mens[21] = new mensDetail(0, 0, "Valor do atributo 'accesskey' deve ser um n�mero ao inv�s de outro caracter", "<span>Recomenda��o 6:</span><h4>Fornecer �ncoras para ir direto a um bloco de conte�do.</h4><p>Para facilitar a utiliza��o das �ncoras, podem ser disponibilizados atalhos por teclado, utilizando o atributo accesskey. � recomendado o uso de n�meros para n�o entrar em conflito com os leitores de tela que utilizam letras em seus atalhos.</p>", ", nas linhas: ");
	mens[22] = new mensDetail(0, 0, "Aus�ncia de 'legend' no fieldset", "<span>Recomenda��o 44:</span><h4>Agrupar campos de formul�rio.</h4><p>Dever�o ser agrupados os controles de formul�rio utilizando-se o elemento fieldset. Para cada fieldset, � poss�vel fornecer uma legenda que explica claramente o prop�sito ou natureza dos agrupamentos.</p>", ", nas linhas: ");
	mens[23] = new mensDetail(1, 1, "Respeitar os padr�es da W3C.", "<span>Recomenda��o 1:</span><h4>Respeitar os padr�es de desenvolvimento Web.</h4><p>� essencial seguir os padr�es de desenvolvimento Web, do W3C (World Wide Web Consortium), com o intuito de maximizar a compatibilidade com atuais e futuros agentes de usu�rio. Por isso, n�o deixe de submeter seu c�digo � an�lise pelos validadores da W3C.</p>", "");
	mens[24] = new mensDetail(1, 1, "Redigir c�digo organizado de forma l�gica e sem�ntica.", "<span>Recomenda��o 2:</span><h4>Organizar o c�digo HTML de forma l�gica e sem�ntica.</h4><p>Deve ser utilizada marca��o sem�ntica adequada para designar cabe�alhos (h1, h2, h3), listas (ul, ol, dl), marca��o de c�digo (code), etc. Assim, as p�ginas poder�o ser apresentadas e compreendidas sem recursos de estiliza��o.</p>", "");
	mens[25] = new mensDetail(1, 1, "Possibilitar navega��o via teclado.", "<span>Recomenda��o 5:</span><h4>Disponibilizar todas as fun��es da p�gina via teclado.</h4><p>As fun��es da p�gina dever�o estar dispon�veis quando for utilizado apenas o teclado. O foco tamb�m n�o dever� estar bloqueado ou fixado em um elemento para que o usu�rio possa mover-se por todos os elementos via teclado.</p>", "");
	mens[26] = new mensDetail(1, 1, "Fornecer links de atalho (skip links).", "<span>Recomenda��o 6:</span><h4>Fornecer �ncoras para ir direto a um bloco de conte�do.</h4><p>Devem ser fornecidas �ncoras, em lugares estrat�gicos da p�gina, que apontem para links relevantes na mesma p�gina. Recomenda-se fornecer atalhos para o menu principal, para o conte�do e para a caixa de pesquisa.</p>", "");
	mens[27] = new mensDetail(1, 0, "Prezar pelo m�todo de desenvolvimento tableless.", "<span>Recomenda��o 7:</span><h4>N�o utilizar tabelas para diagrama��o.</h4><p>Tabelas devem ser utilizadas apenas para dados tabulares e n�o para efeitos de disposi��o dos elementos na p�gina. Para este fim, utilize folhas de estilo.</p>", "");
	mens[28] = new mensDetail(1, 0, "Separar links adjacentes.", "<span>Recomenda��o 8:</span><h4>Separar links adjacentes.</h4><p>Links adjacentes devem ser separados por mais do que simples espa�os. � recomendado o uso de listas, onde cada elemento dentro da lista � um link. Pode-se utilizar v�rgulas ou par�nteses para separar links em um par�grafo.</p>", "");
	mens[29] = new mensDetail(1, 1, "Possibilitar altera��o de limites de tempo.", "<span>Recomenda��o 13:</span><h4>Fornecer alternativa para modificar limite de tempo.</h4><p>Em uma p�gina onde h� limite de tempo para realizar uma tarefa deve haver a op��o de desligar, ajustar ou prolongar esse limite, a menos que esse limite de tempo seja absolutamente necess�rio.</p>", "");
	mens[30] = new mensDetail(1, 0, "N�o incluir situa��es com intermit�ncia de tela.", "<span>Recomenda��o 14:</span><h4>N�o incluir situa��es com intermit�ncia de tela.</h4><p>N�o devem ser utilizados efeitos visuais piscantes, intermitentes ou cintilantes. A exig�ncia dessa diretriz aplica-se tamb�m para propaganda de terceiros inserida na p�gina.</p>", "");
	mens[31] = new mensDetail(1, 0, "Controlar conte�do com movimentos.", "<span>Recomenda��o 15:</span><h4>Assegurar o controle do usu�rio sobre as altera��es temporais do conte�do.</h4><p>Conte�dos com movimento, rolagens ou anima��es n�o devem ser disparados sem o controle do usu�rio. Al�m disso, o usu�rio deve ser capaz de parar e reiniciar conte�dos que se movem, sem exce��o.</p>", "");
	mens[32] = new mensDetail(1, 1, "Fornecer localiza��o do usu�rio em meio �s p�ginas navegadas.", "<span>Recomenda��o 18:</span><h4>Disponibilizar informa��o sobre a localiza��o do usu�rio na p�gina.</h4><p>Dever� ser fornecido um mecanismo que permita ao usu�rio orientar-se dentro de um conjunto de p�ginas, permitindo que ele saiba onde est� no momento. Para isso podem ser utilizadas 'migalhas de p�o' (breadcrumbs).</p>", "");
	mens[33] = new mensDetail(1, 0, "Descrever bem os links da p�gina.", "<span>Recomenda��o 19:</span><h4>Descrever links clara e sucintamente.</h4><p>O texto do link deve fazer sentido mesmo quando isolado do contexto da p�gina e deve-se identificar claramente seu destino. N�o � recomendada a utiliza��o de links do tipo 'clique aqui' pois n�o faz sentido fora do contexto.</p>", "");
	mens[34] = new mensDetail(1, 1, "Utilizar documentos em formatos acess�veis.", "<span>Recomenda��o 22:</span><h4>Disponibilizar documentos em formatos acess�veis.</h4><p>Os documentos devem ser disponibilizados preferencialmente em HTML, ou mesmo no formato ODF, tomando-se os cuidados para que sejam acess�veis.  Ao utilizar PDF, dever� ser fornecida uma alternativa em HTML ou ODF. � necess�rio, tamb�m, informar a extens�o e o tamanho do arquivo no pr�prio texto do link.</p>", "");
	mens[35] = new mensDetail(1, 0, "Associar c�lulas de tabelas.", "<span>Recomenda��o 24:</span><h4>Associar c�lulas de dados �s c�lulas de cabe�alho em uma tabela.</h4><p>Em tabelas de dados simples, deve-se utilizar &lt;th&gt; para cabe�alhos e &lt;td&gt; para c�lulas de dados. Deve-se utilizar os elementos thead, tbody e tfoot, com exce��o de quando a tabela possuir apenas o corpo, sem ter se��es de cabe�alho e rodap�. Para tabelas mais complexas, � necess�rio associar c�lulas de dados com c�lulas de cabe�alho utilizando os elementos id/headers ou scope/col.</p>", "");
	mens[36] = new mensDetail(1, 1, "Redigir conte�do de f�cil leitura e compreens�o.", "<span>Recomenda��o 25:</span><h4>Garantir a leitura e compreens�o das informa��es.</h4><p>O texto de um s�tio deve ser de f�cil leitura e compreens�o. Quando o texto exigir uma capacidade de leitura mais avan�ada, deve ser disponibilizado informa��es suplementares que expliquem ou ilustrem conte�do principal.</p>", "");
	mens[37] = new mensDetail(1, 1, "Explicar siglas, abreviaturas e palavras incomuns.", "<span>Recomenda��o 26:</span><h4>Disponibilizar uma explica��o para siglas, abreviaturas e palavras incomuns.</h4><p>Deve estar dispon�vel uma explica��o que identifique a forma completa ou o significado das abreviaturas e siglas. Para isso, pode ser utilizada o elemento &lt;abbr&gt;.</p>", "");
	mens[38] = new mensDetail(1, 1, "Identificar conte�do de diferentes idiomas.", "<span>Recomenda��o 27:</span><h4>Informar mudan�a de idioma no conte�do.</h4><p>Deve-se identificar pelo atributo lang se algum elemento da p�gina possuir conte�do em um idioma diferente do principal. Essa recomenda��o n�o se aplica para nomes pr�prios ou termos t�cnicos que sejam compreendidos no contexto.</p>", "");
	mens[39] = new mensDetail(1, 1, "Fornecer contraste entre plano de fundo e primeiro plano.", "<span>Recomenda��o 28:</span><h4>Oferecer contraste m�nimo entre plano de fundo e primeiro plano.</h4><p>As cores entre esses planos dever�o ser suficientemente contrastantes para que possam ser visualizadas, tamb�m, por pessoas com baixa vis�o, com cromodefici�ncias ou que utilizam monitores de v�deo monocrom�tico. N�o dever�o ser utilizadas imagens atr�s do texto (background), pois acabam por dificultar a leitura e desviar a aten��o do usu�rio.</p>", "");
	mens[40] = new mensDetail(1, 1, "N�o diferenciar conte�do apenas por caracter�sticas sensoriais.", "<span>Recomenda��o 29:</span><h4>N�o utilizar apenas cor ou outras caracter�sticas sensoriais para diferenciar elementos.</h4><p>Caracter�sticas sensoriais como cor, forma, tamanho, localiza��o visual ou som n�o devem ser utilizadas como o �nico meio para transmitir informa��es, indicar uma a��o, pedir uma resposta ao usu�rio ou distinguir um elemento visual.</p>", "");
	mens[41] = new mensDetail(1, 1, "Permitir redimensionamento sem perda de funcionalidade.", "<span>Recomenda��o 30:</span><h4>Permitir redimensionamento de texto sem perda de funcionalidade.</h4><p>A p�gina deve continuar leg�vel e funcional quando redimensionada para at� 200%. Assim, � preciso garantir que, quando a p�gina for redimensionada, n�o ocorram sobreposi��es de texto nem o aparecimento de uma barra horizontal.</p>", "");
	mens[42] = new mensDetail(1, 1, "Dividir �reas de informa��o e manter guidelines.", "<span>Recomenda��o 31:</span><h4>Dividir as �reas de informa��o.</h4><p>As divis�es mais comuns s�o 'topo', 'conte�do', 'menu' e 'rodap�'. Nas p�ginas internas deve-se procurar manter uma mesma divis�o para que o usu�rio se familiarize mais rapidamente com a estrutura do s�tio.</p>", "");
	mens[43] = new mensDetail(1, 1, "Evidenciar elemento em foco.", "<span>Recomenda��o 32:</span><h4>Possibilitar que o elemento com foco seja visualmente evidente.</h4><p>A �rea que recebe o foco pelo teclado deve ser claramente marcada e clic�vel. Por padr�o, links e elementos de formul�rio j� apresentam essa borda que pode ser modificada via CSS, mas n�o dever� ser removida.</p>", "");
	mens[44] = new mensDetail(1, 0, "Fornecer alternativa para v�deo.", "<span>Recomenda��o 33:</span><h4>Fornecer alternativa para v�deo.</h4><p>Deve haver uma alternativa sonora ou textual para v�deos que n�o incluem faixas de �udio. Para v�deos que cont�m �udio falado e no idioma natural da p�gina, devem ser fornecidas legendas.</p>", "");
	mens[45] = new mensDetail(1, 0, "Fornecer alternativa para �udio.", "<span>Recomenda��o 34:</span><h4>Fornecer alternativa para �udio.</h4><p>�udio gravado deve possuir uma transcri��o descritiva. Tamb�m � desej�vel a alternativa em Libras.</p>", "");
	mens[46] = new mensDetail(1, 0, "Fornecer audiodescri��o para v�deos.", "<span>Recomenda��o 35:</span><h4>Oferecer audiodescri��o para v�deo pr�-gravado.</h4><p>V�deos que transmitem conte�do visual que n�o est� dispon�vel na faixa de �udio devem possuir uma audiodescri��o. Apresentada nos espa�os entre os di�logos, a audiodescri��o � a descri��o das informa��es apresentadas visualmente.</p>", "");
	mens[47] = new mensDetail(1, 0, "Fornecer controle de �udio.", "<span>Recomenda��o 36:</span><h4>Fornecer controle de �udio para som.</h4><p>Deve ser fornecido um mecanismo para parar, pausar, silenciar ou ajustar o volume de qualquer som que se reproduza na p�gina.</p>", "");
	mens[48] = new mensDetail(1, 0, "Fornecer controle de anima��o.", "<span>Recomenda��o 37:</span><h4>Fornecer controle de anima��o.</h4><p>Para qualquer anima��o que inicie automaticamente na p�gina devem ser fornecidos mecanismos para que o usu�rio possa pausar, parar ou ocultar tal anima��o.</p>", "");
	mens[49] = new mensDetail(1, 0, "Associar etiquetas aos seus campos.", "<span>Recomenda��o 39:</span><h4>Associar etiquetas aos seus campos.</h4><p>As etiquetas de texto (label) devem estar associadas aos seus campos (input) correspondentes no formul�rio, atrav�s dos atributos for do label e id do input, os quais dever�o ter o mesmo valor.</p>", "");
	mens[50] = new mensDetail(1, 0, "Desenvolver formul�rios visando uma ordem l�gica de navega��o.", "<span>Recomenda��o 40:</span><h4>Estabelecer uma ordem l�gica de navega��o.</h4><p>Os elementos do formul�rio devem ser distribu�dos corretamente atrav�s do c�digo HTML, criando, assim, uma sequ�ncia l�gica de navega��o.</p>", "");
	mens[51] = new mensDetail(1, 0, "Evitar altera��es autom�ticas no contexto.", "<span>Recomenda��o 41:</span><h4>N�o provocar automaticamente altera��o no contexto.</h4><p>As mudan�as devem ocorrer atrav�s do acionamento de um bot�o. Quando um elemento de formul�rio receber o foco, n�o deve ser iniciada uma mudan�a autom�tica na p�gina.</p>", "");
	mens[52] = new mensDetail(1, 0, "Fornecer sugest�o de preenchimento em campos de entrada.", "<span>Recomenda��o 42:</span><h4>Fornecer instru��es para entrada de dados.</h4><p>Para conte�do que exigir entrada de dados por parte do usu�rio, devem ser fornecidas, quando necess�rio, instru��es de preenchimento juntamente com as etiquetas (label).</p>", "");
	mens[53] = new mensDetail(1, 0, "Identificar e descrever erros em dados de entrada.", "<span>Recomenda��o 43:</span><h4>Identificar e descrever erros de entrada de dados.</h4><p>Quando um erro de entrada de dados for automaticamente detectado, o item que apresenta erro deve ser identificado e descrito ao usu�rio por texto.</p>", "");
	mens[54] = new mensDetail(1, 0, "Fornecer CAPTCHA em formul�rio.", "<span>Recomenda��o 45:</span><h4>Fornecer CAPTCHA humano.</h4><p>O CAPTCHA (teste interativo humano, completamente automatizado, para distinguir computadores de seres humanos) dever� ser utilizado apenas quando estritamente necess�rio. Quando utilizado, dever� ser fornecido em forma de uma pergunta n�o seja de dif�cil resolu��o, permitindo que a mesma possa ser respondida por pessoas de variadas culturas e n�veis de instru��o.</p>", "");
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

		// Total de linhas do c�digo HTML
		var htmlaux = html.split("\n");
		var rows = htmlaux.length;

		stack.last = function(){
			return this[ this.length - 1 ];
		};

		try{
			while(html){
				chars = true;

				// Para ter certeza de n�o estar em um elemento 'style'
				if ( !stack.last() || !special[ stack.last() ] ) {

					// Coment�rio
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
						
						// Esquece �ltima tag lida
						arrFlag[14] = " "; 
						
						if ( match ) {
							html = html.substring( match[0].length );
							match[0].replace( endTag, parseEndTag );
							chars = false;
						}

					// Tag de abertura
					} else if ( html.indexOf("<") == 0 ) {
						match = html.match( startTag );
						
						// Armazena �ltima tag lida
						arrFlag[14] = match[1]; 
						
						if ( match ) {
							html = html.substring( match[0].length );
							match[0].replace( startTag, parseStartTag );
							chars = false;
						}
					}
					
					if ( chars ) {
						// Se a �ltima tag lida foi <script> ignora seu conte�do
						// caso contr�rio, procura in�cio de nova tag
						arrFlag[14] == "script" ? index = html.indexOf("</script>") : index = html.indexOf("<");
						
						// Esquece �ltima tag lida
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
			// Total de linhas restantes no c�digo HTML
			var htmlleft = html.split("\n");
			var rowsleft = htmlleft.length;
			// Linha onde ocorreu o erro: rowsright + 1
			var rowsocc = (rows - rowsleft) + 1;

			mens[0].ocorrencia = 1; 
			mens[0].linha = mens[0].linha + rowsocc;
		}
		
		
		// Tratamento de erro: limpa tags remanecentes
		parseEndTag();
		
		// Identifica erros sem linhas de ocorr�ncia
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

			// Sinaliza a presen�a de um elemento do tipo imagem (type="image")
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

				// Sinaliza a exist�ncia do elemento 'table' sem elemento 'caption'
				if(arrFlag[2]) 
					codErr[11] = 1; 
				
				// Salva a ocorr�ncia do erro 8 antes de reinicializar o vetor
				var aux = codErr[8]; 
				
				// Prototipo para gerar vers�o JSON do c�digo ////////////////////// ///////////////////
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
			// Se n�o for fornecido nome de nenhuma tag
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
						// Registra erro caso n�o exista nenhum 'fieldset' dentro do form
						codErr[20] = 1;
						arrFlag[11] = errorRow(rows,html);
					}else{
						arrFlag[1] = 0;
					}
					
				}else if((tagName == "fieldset")&&(arrFlag[8])){
					// Registra erro caso n�o exista 'legend' dentro do 'fieldset'
					arrFlag[8] = 0; 
					codErr[22] = 1;
					arrFlag[12] = errorRow(rows,html);
					
				}else if((tagName == "table")&&(arrFlag[2])){ 				
					// Registra erro caso n�o exista 'caption' dentro da tabela
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
			
			// Prototipo para gerar vers�o JSON do c�digo //////////////////////
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
	 * Chama a fun��o HTMLParser para an�lise do c�digo HTML
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
		
		// Prototipo para gerar vers�o JSON do c�digo //////////////////////
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
	 * de ocorr�ncias, descri��o e linhas onde ocorreram os erros.
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
	 * Linha de ocorr�ncia do erro.
	 * C�lcula diferen�a entre quantidade de quebras de linha 
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
	 * Erros sem linha de ocorr�ncia.
	 * Registra erro em elementos que deveriam estar na p�gina, 
	 * mas n�o s�o esperados em uma linha espec�fica.
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
	 * Identifica erros causados pela exist�ncia impr�pria ou 
	 * aus�ncia de atributos e/ou valores de atributos segundo o e-MAG v3.0.
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
	 * Identifica erros causados pela exist�ncia impr�pria ou 
	 * aus�ncia de elementos segundo o e-MAG v3.0.
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
