/**
 * eScanner - Visualizador de Código-Fonte
 * Relaciona os resultados da análise às linhas de código.
 * Exibe também uma visualização do código numa estrutura de árvore radial.
 *
 * @author Victor Adriel de J. Oliveira
 */

$().ready(function(){
	redisplay();

	try{ gerartree(localStorage['jsonCode']); }
	catch(err){ $("#chart").html("<center><h3>Não foi possível gerar a representação do código em árvore.</h3></center>"); }

	$(".code").text(addNumbers(localStorage['htmlCode']));
	$("#pagName a").text(localStorage['pageName']).attr("href",localStorage['pageName']);
	var erros = JSON.parse(localStorage['errosArray']);

	var lineHeight = 19; // Altura das linhas e largura da marcação do erro no código
	var marcacaoErr = new Array();	
	
	// Exibe resultado prévio da análise //////////////////////////////////////////////////////////////////////////////////////	
	var contEr = 0, contAl=0, primeiraOcorr = 1, qtdOcorr = 1;
	$(".mensagens .resanalise").css("overflow-y","scroll");
	$("#erros, #alertas").hide();
			
	for ( var i = 1; i < erros.length; i++ ){		
		if((erros[i].tipo == 0)&&(erros[i].ocorrencia > 0)){
			// Marca ocorrências //
			if((i != 4)&&(i != 8)){ 
				// Transforma string e deixa apenas numeros e virgulas
				var from = erros[i].linha.indexOf(":");
				var to = erros[i].linha.indexOf(".");
				var linhas = erros[i].linha.substring(from+1,to);
				linhas = linhas.replace(" e",",");

				if(erros[i].ocorrencia == 1){
					if(novaOcorrencia(linhas)){
						$(".code").prepend("<div class='boxlinha "+linhas+"' style='margin-top:"+ (linhas-1)*lineHeight +"px'><span>[ "+ erros[i].descricao +" ] -- 1 ocorrência</span></div>");
					}else{
						// procura ocorrencia antiga e adiciona descrição
						$(".code").find("div." + parseInt(linhas)).append("<br/><span>[ "+ erros[i].descricao +" ] -- 1 ocorrência</span>");
					}
				} else {
					linhas = linhas.split(",");
					for(var j = 0; j < linhas.length; j++){
						if(novaOcorrencia(linhas[j])){
							$(".code").prepend("<div class='boxlinha "+linhas[j]+"' style='margin-top:"+ (linhas[j]-1)*lineHeight +"px'><span class='descErr"+ i +"'>[ "+ erros[i].descricao +" ]</span></div>");
							primeiraOcorr = 0;
						}else{
							// procura ocorrencia antiga do mesmo erro e adiciona descrição
							if(primeiraOcorr) $(".code").find("div." + parseInt(linhas[j])).append("<br/><span class='descErr"+ i +"'>[ "+ erros[i].descricao +" ]</span>");
							else qtdOcorr++;
							primeiraOcorr = 0;
						}
					}
					if(qtdOcorr == 1) $(".code").find("span.descErr" + parseInt(i)).append(" -- " + qtdOcorr + " ocorrência");
					else $(".code").find("span.descErr" + parseInt(i)).append(" -- " + qtdOcorr + " ocorrências");
					primeiraOcorr = 1;
					qtdOcorr = 1;
				}
			} 
			///////////////////////
			contEr++;
			erros[i].linha = linhaToSpan(erros[i].ocorrencia, erros[i].linha);
			$(".grupoErros").append("<div class='item erro'><a href='#'></a><p>"+ erros[i].descricao + "" + erros[i].linha +"</p><div class='detalhes'>" + erros[i].detalhe +"</div></div>");
		}
		else if((erros[i].tipo == 1)&&(erros[i].ocorrencia > 0)){
			contAl++;
			$(".grupoAlertas").append("<div class='item alerta'><a href='#'></a><p>"+ erros[i].descricao + "</p><div class='detalhes'>" + erros[i].detalhe +"</div></div>");
		}
	}
	

	$(".mensagens .code").scroll(function(){
		// Adiciona sombra à caixa com o código quando o scroll é modificado
		if($(this).scrollTop() > 5){
			if($(this).scrollLeft() > 5) $(".mensagens .code").css("box-shadow","inset 0px 0px 10px #000000");
			else $(".mensagens .code").css("box-shadow","inset -10px 0px 10px #000000");
		}
		else if($(this).scrollLeft() > 5) $(".mensagens .code").css("box-shadow","inset 0px -10px 10px #000000");
		else $(".mensagens .code").css("box-shadow","none");

		// Mantem marcação apesar do scroll em x
		$(".boxlinha").css({ 'left': $(this).scrollLeft() });
	});

	// Marca ocorrência de interrupção da análise
	if(erros[0].ocorrencia){
		$(".code").prepend("<div class='boxlinha' style='margin-top:"+ (erros[0].linha-2)*lineHeight +"px; background:#000; text-align:center;'>A análise foi interrompida na linha abaixo! Verifique a linha "+ erros[0].linha +" do teu código.</div>");
		$(".code").prepend("<div class='boxlinha' style='margin-top:"+ (erros[0].linha-1)*lineHeight +"px; text-align:center;'></div>");
	}
	
	// Exibir e/ou esconder descrição do erro na linha marcada
	$(".code").find(".boxlinha span").hide();
	$(".code").find(".boxlinha").mouseover(function(){
		var off = $(this).offset();
		var countspans = $(this).find("span").size();		
		countspans = countspans * 19;
		if(off.top <= 76 + countspans){
			$(this).find("span").css("margin-top","0px").show();
			$(this).find("span:first").css("margin-top","19px").show();
		} else {			
			$(this).find("span").css("margin-top","-"+countspans+"px").show();
		}
	}).mouseleave(function(){
		$(this).find("span").hide();
	});

	// Alternar cores dos spans com descrição do erro
	$(".code").find(".boxlinha span:even").css("background","#0A0A0A");
	
	// Atualizar menu com quantidades de alertas e erros
	if(contEr == 1) $("#resumo ul li a:first").html(contEr + " erro");
	else $("#resumo ul li a:first").html(contEr + " erros");
	
	if(contAl == 1) $("#resumo ul li a:last").html(contAl + " alerta"); 
	else $("#resumo ul li a:last").html(contAl + " alertas"); 
	
	if (contEr > 0) $("#erros").show();
	if (contAl > 0) $("#alertas").show();
	$(".detalhes").hide();
	
	// Exibir e/ou esconder detalhes da mensagem
	$(".grupoErros a, .grupoAlertas a").toggle(
		function(){
			$(this).parent().find(".detalhes").slideDown();
			$(this).css("background","url(../images/minus.png)");
		},
		function(){
			$(this).parent().find(".detalhes").slideUp();
			$(this).css("background","url(../images/plus.png)");
		}
	);

	// Saltar para linha marcada
	$(".linktorow").click(function(){
		var torow = $(this).attr("class");
		torow = torow.replace("linktorow ","");
		saltaPara(torow);
	});
	
	// Gerar visualização do código em forma de árvore radial /////////////////////////////////////////////////////////////////
	function gerartree(jsontext){			
		var treeHeight = $("div.json").height();
		var treeWidth = $("div.json").width();
		var radius = treeWidth/2;

		var tree = d3.layout.tree()
			.size([360, radius - 60])
			.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

		var diagonal = d3.svg.diagonal.radial()
			.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

		var vis = d3.select("#chart").append("svg")
			.attr("width", treeWidth)
			.attr("height", treeHeight)
			.append("g")
			.attr("transform", "translate(" + treeWidth/2 + "," + treeHeight/2 + ")");
		
		json = JSON.parse(jsontext);
		var nodes = tree.nodes(json);

		var link = vis.selectAll("path.link")
			.data(tree.links(nodes))
			.enter().append("path")
			.attr("class", "link")
			.attr("d", diagonal);

		var node = vis.selectAll("g.node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
		  
		node.append("circle")
			.attr("r", treeWidth/90)
			.style("stroke",function(d){ 
				if(d.error == "1") return "#F00"; // border changes
				else return "steelblue";
			})
			.style("fill",function(d){ 
				if(d.error == "1") return "#F00"; // background changes
				else return "#fff";
			})
			.style("cursor", function(d){
				if(d.row != -1){
					return "pointer" ;
				}
			})
			.on("click", function(d){
				if(d.row != -1){
					saltaPara(d.row);
				}
			});

		node.append("text")
			.attr("dx", function(d) { return d.x < 180 ? 12 : -12; })
			.attr("dy", ".30em")
			.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
			.text(function(d) { return d.name; });
	}
	
	// Menu de exibição da árvore e das mensagens (erros e alertas) ///////////////////////////////////////////////////////////
	$("a.treecode").click(function(){
		if(localStorage['viewCode'] == 1){
			localStorage['viewCode'] = 0;
			redisplay();
		}else{
			localStorage['viewCode'] = 1;
			redisplay();
		}
	});
	
	$("a.infocode").click(function(){
		if(localStorage['viewCode'] == 2){
			localStorage['viewCode'] = 0;
			redisplay();
		}else{
			localStorage['viewCode'] = 2;
			redisplay();
		}
	});
	
	// Ajusta dimensões estáticas e mantém opções do usuário
	function redisplay(){		
		if(localStorage['viewCode'] == 0){
			$(".code").css("width","98%");
			$("div.json, div.resanalise").hide();
			$(".treec, .infoc").removeClass("ativo");
			$(".treecode").css("background","url(../images/ctreeoff.png) no-repeat 50% 80%");
			$(".infocode").css("background","url(../images/cremoveoff.png) no-repeat 50% 80%");
		}else if(localStorage['viewCode'] == 1){
			$(".code").css("width","49%");
			$("div.resanalise").hide();
			$("div.json").show();
			$(".infoc").removeClass("ativo");
			$(".treec").addClass("ativo");
			$(".treecode").css("background","url(../images/ctree.png) no-repeat 50% 80%");
			$(".infocode").css("background","url(../images/cremoveoff.png) no-repeat 50% 80%");
		}else{
			$(".code").css("width","69%");
			$("div.json").hide();
			$("div.resanalise").show();
			$(".treec").removeClass("ativo");
			$(".infoc").addClass("ativo");
			$(".treecode").css("background","url(../images/ctreeoff.png) no-repeat 50% 80%");
			$(".infocode").css("background","url(../images/cremove.png) no-repeat 50% 80%");
		}
		$(".infoc").show();
		
		var tam = $("body").width();
		if(tam < 1050){
			$(".infoc").css("opacity","0.3");
			if(localStorage['viewCode'] == 2){
				$("div.resanalise").hide();
				$(".code").css("width","98%");	
			}
		}
	}
	
	function novaOcorrencia(linha){
		if(marcacaoErr[linha] == 1){
			return 0;
		}
		else{			
			marcacaoErr[linha] = 1;
			return 1;
		}		
	}

	function saltaPara(linha){
		$(".code").prepend("<div id='destaque' class='boxlinhaflash' style='margin-left: "+ $(".mensagens .code").scrollLeft() +"; margin-top:"+ (linha - 1)*lineHeight +"px'>_</div>");
		var alt = $(".code").find("#destaque").height();
		$(".code").scrollTop(alt*(linha-1));
		$(".code").find("#destaque").fadeOut(1000);
	}
	
	function linhaToSpan(ocorrencia, linha){
		if((i != 4)&&(i != 8)){ 
			var from = erros[i].linha.indexOf(":");
			var to = erros[i].linha.indexOf(".");
			var linhas = erros[i].linha.substring(from+1,to);
			linhas = linhas.replace(" e",",");

			if(ocorrencia == 1){
				linhas = linhas.replace(" ","");
				linha = ", na linha: <span class='linktorow "+linhas+"'>"+linhas+"</span>.";
			} else {
				linhas = linhas.split(",");
				linha = ", nas linhas: "
				for(var j = 0; j < linhas.length; j++){
					linhas[j] = linhas[j].replace(" ","");
					linha = linha.concat("<span class='linktorow "+linhas[j]+"'>"+linhas[j]+"</span>, ");
				}
				// Substitui ultima virgula por ponto
				var num = linha.lastIndexOf(",");
				linha = linha.slice(0,num).concat(".");

				// Substitui penultima virgula pela conjunção 'e'
				num = linha.lastIndexOf(",");
				num2 = linha.lastIndexOf(".");
				st = linha.slice(0,num).concat(" e");
				linha = st.concat(linha.slice(num+1,num2+1));
			}
		}
		return linha;
	}

	function addNumbers(htmlCode) {
		var codeNum = "";
		htmlCode = htmlCode.split("\n");		
		for(var j = 0; j < htmlCode.length; j++){
			if(j<9) codeNum = codeNum + 0;
			codeNum = codeNum + (j+1) + "\t " + htmlCode[j] + "\n";
		}
		return codeNum;
	}

	$(window).resize(function(){
		window.location.reload();
	});
})();
