/**
 * eScanner
 * Captura código-fonte, envia para a análise e exibe resultados.
 *
 * @author Victor Adriel de J. Oliveira
 */

(function(){
	var xmlhttp = new XMLHttpRequest();
	var erros = new Array();
	var html, contEr = 0, contAl = 0, addPage = "", success = 0;
	
	$('#newTab').click(function(){
		chrome.tabs.create({'url': chrome.extension.getURL('reviewCodeSource/viewCode.html')}, function(tab) {
			localStorage['viewCode'] = 2;
			localStorage['pageName'] = addPage;
			localStorage['htmlCode'] = html;
			localStorage['jsonCode'] = erros[55].detalhe;
			localStorage['errosArray'] = JSON.stringify(erros);
		});
	});
	
	$(".container").css("overflow-y","scroll");
	$("#resumo ul, #erros, #alertas, #newTab").hide();
	
	function formataLinhas(ocorrencia, linha){
		// Substitui ultima virgula por ponto
		var num = linha.lastIndexOf(",");
		linha = linha.slice(0,num).concat(".");
		
		if(ocorrencia > 1){
			// Substitui penultima virgula pela conjunção 'e'
			num = linha.lastIndexOf(",");
			num2 = linha.lastIndexOf(".");
			st = linha.slice(0,num).concat(" e");
			linha = st.concat(linha.slice(num+1,num2+1));
		}
		else if(ocorrencia == 1){
			linha = linha.replace("nas linhas","na linha");
		}
		
		return linha;
	}
	
	function alteraURL(url){
		var str ="";
		addPage = url;
		xmlhttp.open("POST", url, true);
		
		xmlhttp.onreadystatechange = function(){
			if (xmlhttp.readyState==4){
				if ((xmlhttp.status == 200)||(xmlhttp.status == 304)) {
					try{
						html = xmlhttp.responseText;
						if((html=="")||(html.match(/^\D+$/))){
							$("img[alt='Carregando']").hide();
							$(".item:first").html("<p>Que estranho...<br/>Não foi possível capturar o código fonte desta página.</p><p>Tente outra vez ou teste outra página.</p>");
						}
						else{							
							erros = ValidaHTML(html);
							success = 1;
							
							for ( var i = 1; i < erros.length; i++ ){								
								if((erros[i].tipo == 0)&&(erros[i].ocorrencia > 0)){
									contEr++;
									erros[i].linha = formataLinhas(erros[i].ocorrencia, erros[i].linha);
									$(".grupoErros").append("<div class='item erro'><a href='#'></a><p>"+ erros[i].descricao + "" + erros[i].linha +"</p><div class='detalhes'>" + erros[i].detalhe +"</div></div>");
								}
								else if((erros[i].tipo == 1)&&(erros[i].ocorrencia > 0)){
									contAl++;
									$(".grupoAlertas").append("<div class='item alerta'><a href='#'></a><p>"+ erros[i].descricao + "</p><div class='detalhes'>" + erros[i].detalhe +"</div></div>");
								}
							}
							
							$("img[alt='Carregando']").hide();
							$(".detalhes").hide();
							
							if(contEr == 1){
								if(erros[0].ocorrencia){  
									$(".item:first").html("<p>Foi identificado " + contEr + " erro</b> no seu código de acordo as recomendações do<br/> e-MAG. Não esqueça de verificar os alertas, pois são recomendações que dependem da avaliação do programador.</p><p><span class='i'>Atenção: O eScanner não conseguiu realizar sua análise a partir da linha <span class='b'>"+ erros[0].linha +"</span>. Provavelmente exista nessa linha algum elemento que não faça parte da sintaxe padrão do XHTML/HTML4. Verifique seu código fonte.<span></p>");
								}else{
									$(".item:first").html("<p>Foi identificado " + contEr + " erro</b> no seu código de acordo as recomendações do<br/> e-MAG.</p><p>Verifique os alertas, pois são recomendações que dependem da avaliação do programador.</p>");
								}
								$("#resumo ul li a:first").html(contEr + " erro"); 
							
							} else if(contEr > 1){
								if(erros[0].ocorrencia){  
									$(".item:first").html("<p>Foram identificados " + contEr + " erros no seu código de acordo as recomendações do e-MAG. Não esqueça de verificar os alertas, pois são recomendações que dependem da avaliação do programador.</p><p><span class='i'>Atenção: O eScanner não conseguiu realizar sua análise a partir da linha <span class='b'>"+ erros[0].linha +"</span>. Provavelmente exista nessa linha algum elemento que não faça parte da sintaxe padrão do XHTML/HTML4. Verifique seu código fonte.<span></p>");
								}else{
									$(".item:first").html("<p>Foram identificados " + contEr + " erros no seu código de acordo as recomendações do e-MAG.</p><p>Verifique os alertas, pois são recomendações que dependem da avaliação do programador.</p>"); 
								}	
								$("#resumo ul li a:first").html(contEr + " erros"); 										
							
							} else{
								$(".item:first").html("<p>Não foram identificados erros no seu código de acordo as recomendações do e-MAG, em sua versão 3.0. <br/>Para uma análise mais detalhada utilize o validador <a href='http://www.dasilva.org.br/'>daSilva</a><br/>ou o <a href='http://www.governoeletronico.gov.br/acoes-e-projetos/e-MAG/ases-avaliador-e-simulador-de-acessibilidade-sitios'>Avaliador e Simulador de Acessibilidade de Sítios - ASES</a>.</p><p>Não deixe de verificar os alertas, pois são recomendações que dependem da avaliação do programador.</p>"); 
								$("#resumo ul li a:first").html(contEr + " erros"); 
								if(erros[0].ocorrencia){  
									$(".item:first").append("<p><span class='i'>Atenção: O eScanner não conseguiu realizar sua análise a partir da linha <span class='b'>"+ erros[0].linha +"</span>. Provavelmente exista nessa linha algum elemento que não faça parte da sintaxe padrão do XHTML/HTML4. Verifique seu código fonte.<span></p>");
								}										
							}
							
							if(contAl == 1){
								$("#resumo ul li a:last").html(contAl + " alerta"); 
							
							}else{
								$("#resumo ul li a:last").html(contAl + " alertas"); 
							}
							
							$("#resumo ul, #newTab").fadeIn();
							if (contEr > 0) $("#erros").show();
							if (contAl > 0) $("#alertas").show();
							
							$(".grupoErros a, .grupoAlertas a").toggle(
								function(){
									$(this).parent().find(".detalhes").slideDown();
									$(this).css("background","url(images/minus.png)");
								},
								function(){
									$(this).parent().find(".detalhes").slideUp();
									$(this).css("background","url(images/plus.png)");
								}
							);
							
							$("div.item:first a").css({"text-decoration":"underline","color":"blue"});
							$("div.item:first a:first").click(function(){
								chrome.tabs.create({'url': 'http://www.dasilva.org.br/'}, function(tab){ });
							});
							$("div.item:first a:last").click(function(){
								chrome.tabs.create({'url': 'http://www.governoeletronico.gov.br/acoes-e-projetos/e-MAG/ases-avaliador-e-simulador-de-acessibilidade-sitios/'}, function(tab){ });
							});
						}
					}catch(err){
						success = 1;
						$("img[alt='Carregando']").hide();
						$(".item:first").html("<p>Desculpe, o eScanner não conseguiu terminar sua análise.<br/> Provavelmente foi encontrado algum elemento que não faz parte da sintaxe padrão do XHTML/HTML4.</p><p>Verifique seu código fonte e tente outra vez.</p>");
					}
				}
				else{
					success = 1;
					$("img[alt='Carregando']").hide();
					$(".item:first").html("<p>Que estranho...<br/>Não foi possível capturar o código fonte desta página.</p><p>Tente outra vez ou teste outra página.</p>");
				}	
			}
		}	
		
		window.setTimeout(function() {
			if (!success){					
				$(".item:first").append("<p>Aguarde mais um pouco...<br/> O eScanner está se esforçando para terminar sua análise.</p>");
			}
		}, 5000);
		
		xmlhttp.send(null);
	}
	
	chrome.tabs.getSelected(null, function(tab) {
		alteraURL(tab.url);
	});
})();
