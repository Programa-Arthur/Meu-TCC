/* ***************************************************************************************************************************************************************
                                                 Código Arduino  Plataforma Expert - versão 2.0.4 
                                instagram: @expert.plataforma - email do resposável: helmo.araujo@ifc.edu.br
***************************************************************************************************************************************************************                   
RESPONSÁVEL: Helmo Alan Batista de Araújo

DATA CRIAÇÃO: 04/04/2023

DESCRIÇÃO DO CÓDIGO: 
Este código foi produzido como parte da interface de aquisição de dados da Plataforma Expert. Sua função é garantir que o usuário possa de modo ágil 
gerenciar e escolher diferentes dispositivos durante práticas didáticas que tenham como finalidade elucidaçoes, demonstraçõrs ou experimentações que 
envolvam aquisição e\ou visualização de de dados em tempo real. Nessa versão o usuário dispões de 04 dispositivos para interações em sala de aula. 
Os dispositivos são: sensor de temperatura do tipo termistor NTC 10k; sensor de distância do tipo HC-SN04; controle de sistema oscilatório com amplitude de 
1,0 Hz até 1,0 kHz; se sensor de luminosidade do tipo LDR. 

PINOS DISPONÍVEIS PARA USO NA PLATAFORMA EXPERT: 
A0 pino associado aos valores de saída do potenciômetro;
A3 pino analógico que pode ser utilizado como digital D17; 
D10 pino digital que permite sinal PWM; 
GND associado a tensão 0 volts; e 
Vcc associado a saída de 5,0 volts.

INFORMAÇÕES GERAIS:
Instituto Federal Catarinense - Campus Avançado Sombrio 

ALTERAÇÔES: Reestruturação do código do hardware da plataforma Expert da versão inicial de 23/10/2015.
*************************************************************************************************************************************************************** */
// Variáveis globais: 
int opcao = 0;            // Opção de qual dispositivo dejesa utilizar
int taxa = 100;           // tempo de espera para o próximo comando ou amostra
int potenciometro = A0;   // Pino de ligação do potênciometro 

void setup() {
  Serial.begin(9600);  // Inicializa a comunicação serial entre Arduino e computador
  while(!Serial);
  // Menu usado para testes no IDE:
  /*
  Serial.println("Digite '1' medir temperatura (°C)");                
  Serial.println("Digite '2' medir distancia (cm)");
  Serial.println("Digite '3' controlar frequência de oscilador (máx: 1,0 kHz)"); // LED/LASER/RELE
  Serial.println("Digite '4' medir luminosidade (%)");
  Serial.println("****************************************************************************************");
  */
  delay(500);                 // Aguarda 100 ms para iniciar o loop
}

void loop() {
  while(Serial.available() == 0){} // Aguarda entrada da opção a ser utilizada
  opcao = Serial.read();         // Lê a opção digitada      
  //Serial.println(opcao);       // Imprime na tela opção digitada (usada apenas para testes no IDE)



  if(opcao == '1'){ // Utilização do sensor de temperatura - thermistor NTC 10 kohms 
             
          int pinoA3 = A3;                    // Definição de uso do pino A3
          float temperatura;                  // Definição da variável que armazenará a temperatura

          while(opcao!=0){                    // Imprime os valores de temperatura
              temperatura = tempCelsius(analogRead(pinoA3));
              
              //Serial.print("@"); 
              Serial.println(temperatura);      // Imprime valor de temperatura na tela
              //Serial.println("@");
              delay(taxa);                    // taxa de espera 
          }     
    }

  else if(opcao == '2'){ // Utilização do sensor de distancia - HC-SN04             
            
          int echo = 10;          // Define o pino 10 para receber o pulso do echo  
          int trig = 17;          // Define pino A3, configurado como digital, para enviar o pulso e gerar o echo
          double distancia;       // Inicia variável que recebe os valores da distância (cm)
            
          pinMode(echo, INPUT);   // Define o pino 10 como entrada de sinal (recebe)
          pinMode(trig, OUTPUT);  // Define o pino 17 como saida de sinal (envia)
          
          while(opcao!=0){ // Imprime os valores de distância durante a chamada dessa opção
              distancia = dist(echo, trig); // Usa a função para calcular a distância 
              //Serial.print("@");      
              Serial.println(distancia);    // Imprime o valor da distância em (cm)
              //Serial.println("@");
              delay(taxa/2);
          }
    }

  else if(opcao == '3'){ // Controle de pisca de um sistema (LED ou LASER ou RELE)    
          
          int pinLUZ = 10;                     // Pino de ligação do LED/LASER/RELE
          int periodo;                         // Inicia variável de período
          int valorPot;
          int valorMedio;

          pinMode(potenciometro, INPUT);       // Configura o potenciômetro dispositivo de entrada de dados
          pinMode(pinLUZ, OUTPUT);             // Configura o potenciômetro dispositivo de entrada de dados
          

          while(opcao!=0){ // Controle do pisca conforme valores do potenciômetro [Pot=0: desliga; Pot>1020: liga; 0<Pot<=1020: pisca]
               valorMedio = 0;
               
               for(int i=1; i<4;i++){
                  valorPot = analogRead(potenciometro);   // Lê valor do relativo a saída do potenciômetro [0 - 1023]
                  valorMedio = valorPot + valorMedio;    // Soma os valores lidos 3 vezes no potenciômetro para calcular a média
               }

               valorMedio =  valorMedio/3;             // Determina a média do valor lido no potenciometro
               
               periodo = map(valorMedio, 6, 1023, 1, 1000);

               if(valorMedio>5){
                  //Serial.print('@');
                  Serial.println(periodo);                   // Imprime valor do perído do pisca LED
                  //Serial.println('@');
               }
               oscilador(periodo, valorMedio, pinLUZ);              // Relaliza a ação de piscar o LED
          }              
  }  
  
  else if(opcao == '4'){ // Utilização do sensor de luminosidade - LDR
          
          int pinA3 = A3;      
          float luminosidade;

          while(opcao!=0){
              luminosidade = analogRead(pinA3);       // Leitura do valor luminosidade [0 - 1023]
              luminosidade = (luminosidade/1023)*100; // Transforma o valor de luminosidade em porcenragem
              //Serial.print("@");
              Serial.println(luminosidade);           // Imprime o valor da porcentagem de luminosidade (%)
              //Serial.println("@");
              delay(taxa);
          }
  }

  else{
       Serial.println("Não é uma opção disponível!!!");
  }
} 
/* ****************************************************************************************************************************************************************
                                                    DEFINIÇÃO DAS FUNÇÕES UTILIZADAS NO CÓDIGO
**************************************************************************************************************************************************************** */
float tempCelsius(float ADCv){ // Essa função determina a temperatura em graus celsius utilizando o termistor NTC 10k

// PARTE I - Cálculo do valor da resistência do termistor (NTC 10k)
float Rserie = 5000;              // Valor nominal da resistência colocada no circuito em série com o termistor 
float R_ntc =  (1023/ADCv)-1;      // Convere o valor ADC em valor de resistência do Termistor;
R_ntc = Rserie/R_ntc;              // Determina o valor da resistência do termistor;    

/* PARTE II -  Cálculo da temperatura com base no modelo de Steinhart-Hart: 1/T = A + B*log(R) + C*log(R)^3
A = 0.00112924;              // Valor do coef. A da equação de Steinhart-Hart 
B = 0.000234108;             // Valor do coef. B da equação de Steinhart-Hart
C = 0.00000087755;           // Valor do coef. C da equação de Steinhart-Hart */      

float LOG_R = log(R_ntc);                                                     // Cálculo do log do termistor - para inserir na equação de Steinhart-Hart
float LOG_R3 = pow(LOG_R,3);                                                  // Cálculo cudo do log do termistor - para inserir na equação de Steinhart-Hart
float Steinhart = 0.00112924 +  0.000234108*LOG_R + 0.00000087755*LOG_R3;     // Determina o inverso da temperatura com a equação de Steinhart-Hart
float celsius = -((1/Steinhart)-273.15);                                      // Determina o valor da temperatura em Celsius: T = (1/Steinhart) - 273.15

return celsius;
}
// ****************************************************************************************************************************************************************
double dist(int echoP, int trigP){ //  Essa função determina a distância com o HC-SN04: dist(Pino echo, Pino Trigger)

   double count = 0;
   double distancia = 0;

  for(int i=1; i<6; i++){                       // Inciada o FOR para determinar a distância média.
      digitalWrite(trigP, LOW);                 // Seta o pino Trigger com um pulso baixo "LOW" ou desligado ou ainda 0 
      delayMicroseconds(2);                     // Aguarda de 2 microssegundos
      digitalWrite(trigP, HIGH);                // Seta o pino Trigger com pulso alto "HIGH" ou ligado ou ainda 
      delayMicroseconds(10);                    // Aguarda de 10 microssegundos
      digitalWrite(trigP, LOW);                 // Seta o pino Trigger com pulso baixo novamente
      double duration = pulseIn(echoP, HIGH);   // Lê o tempo decorrido entre a chamada e o pino Echo entrar no estado "HIGH"
      distancia = ((duration / 29) / 2);        // Esse calculo é baseado em s = v . t, lembrando que o tempo vem dobrado porque é o tempo de ida e volta do ultrassom
  count =   distancia + count;              // Somatória de 5 amostras de distância para o cálculo da média
   }
  distancia  = count/9;                         // Valor médio da distância após 5 amostras
  delay(100);
  return distancia;                              // Retorna o valor da distância (cm)
}
// ****************************************************************************************************************************************************************
void oscilador(int periodo, int valorMedio, int pinLUZ){ // Essa função gera um sinal de oscilação variável (usada em pisca LED, LASER, RELE ou qualquer outro atuador)
     
   if(valorMedio == 0){                             // Se o valor lido for zero desliga o sistema                           
       digitalWrite(pinLUZ, LOW); 
   }           
   else if(valorMedio>0 && valorMedio<=5){          // Se o valor lido for maior que 0 e menor que 5 o sistema fica ligado
       digitalWrite(pinLUZ, HIGH);
   }
  else if(valorMedio>5 && valorMedio<=1023){        // Se o valor lido é 5 <= perído <= 1023 o sistema pisca conforme o valor do período              
       digitalWrite(pinLUZ, HIGH);            
       delay(periodo);
       digitalWrite(pinLUZ, LOW);
       delay(periodo);       
   }
}
// ****************************************************************************************************************************************************************
