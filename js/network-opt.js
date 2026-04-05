// ============================================================================
// network-opt.js
// Enterprise Network Optimization — GLPK solver, demand generation,
// heatmap visualization, service zones, sensitivity analysis
// ============================================================================

// ══════════════════════════════════════════════════════════════════════
// DEMAND DATA GENERATOR — Business Archetypes at 3-Digit ZIP Level
// ══════════════════════════════════════════════════════════════════════

// Compressed US 3-digit ZIP database: [zip3, city, state, lat, lng, population_index]
// population_index is relative weight 1-100 (100 = NYC metro area density)
var NETOPT_ZIP3_DB = [
  // Northeast Corridor
  ['100','New York','NY',40.71,-74.01,100],['101','New York','NY',40.75,-73.98,45],['102','New York','NY',40.80,-73.95,30],
  ['103','Staten Is','NY',40.58,-74.15,22],['104','Bronx','NY',40.85,-73.87,35],['105','Westchester','NY',41.03,-73.76,25],
  ['106','White Plains','NY',41.03,-73.77,18],['107','Yonkers','NY',40.93,-73.90,20],['108','New Rochelle','NY',40.91,-73.78,15],
  ['110','Queens','NY',40.73,-73.79,40],['111','Long Island City','NY',40.74,-73.92,28],['112','Brooklyn','NY',40.65,-73.95,42],
  ['113','Brooklyn','NY',40.63,-73.93,30],['114','Jamaica','NY',40.69,-73.79,25],['115','W Nassau','NY',40.72,-73.64,20],
  ['116','Long Island','NY',40.75,-73.41,18],['117','Hicksville','NY',40.77,-73.52,16],['118','Hauppauge','NY',40.82,-73.20,12],
  ['119','Riverhead','NY',40.92,-72.66,8],
  ['070','Newark','NJ',40.73,-74.17,35],['071','Newark','NJ',40.74,-74.16,28],['072','Elizabeth','NJ',40.66,-74.21,22],
  ['073','Jersey City','NJ',40.73,-74.08,30],['074','Paterson','NJ',40.92,-74.17,20],['075','Paterson','NJ',40.91,-74.16,15],
  ['076','Hackensack','NJ',40.89,-74.04,18],['077','Red Bank','NJ',40.35,-74.06,12],['078','Dover','NJ',40.88,-74.56,10],
  ['079','Summit','NJ',40.72,-74.36,14],['080','S Jersey','NJ',39.95,-75.12,16],['081','Camden','NJ',39.94,-75.12,18],
  ['085','Trenton','NJ',40.22,-74.76,14],['086','Trenton','NJ',40.23,-74.77,10],['087','Toms River','NJ',39.95,-74.20,12],
  ['088','New Brunswick','NJ',40.49,-74.45,16],['089','New Brunswick','NJ',40.50,-74.44,12],
  ['060','Hartford','CT',41.76,-72.68,18],['061','Hartford','CT',41.77,-72.67,12],['062','Middletown','CT',41.46,-72.82,8],
  ['063','New London','CT',41.36,-72.10,7],['064','New Haven','CT',41.31,-72.92,15],['065','New Haven','CT',41.30,-72.93,12],
  ['066','Bridgeport','CT',41.19,-73.19,18],['067','Waterbury','CT',41.56,-73.04,10],['068','Stamford','CT',41.05,-73.54,16],
  ['010','Springfield','MA',42.10,-72.59,12],['011','Springfield','MA',42.11,-72.58,8],['012','Pittsfield','MA',42.45,-73.26,5],
  ['013','Greenfield','MA',42.59,-72.60,4],['014','Worcester','MA',42.26,-71.80,14],['015','Worcester','MA',42.27,-71.79,10],
  ['016','Worcester','MA',42.28,-71.78,8],['017','Framingham','MA',42.28,-71.42,12],['018','Middleboro','MA',41.89,-70.91,8],
  ['019','Lynn','MA',42.47,-70.95,10],['020','Brockton','MA',42.08,-71.02,14],['021','Boston','MA',42.36,-71.06,38],
  ['022','Boston','MA',42.35,-71.07,30],['023','Brockton','MA',42.08,-71.01,10],['024','Lexington','MA',42.45,-71.23,14],
  ['025','Buzzards Bay','MA',41.74,-70.62,6],['026','Cape Cod','MA',41.67,-70.30,5],['027','Providence','RI',41.82,-71.41,16],
  ['028','Providence','RI',41.83,-71.40,12],['029','Providence','RI',41.84,-71.39,8],
  ['030','Manchester','NH',43.00,-71.45,10],['031','Manchester','NH',43.01,-71.44,8],['032','Concord','NH',43.21,-71.54,6],
  ['033','Concord','NH',43.22,-71.53,4],['034','Keene','NH',42.93,-72.28,3],['035','Littleton','NH',44.31,-71.77,2],
  ['036','Claremont','NH',43.38,-72.35,2],['037','White River','VT',43.65,-72.32,3],['038','Portsmouth','NH',43.08,-70.76,6],
  ['039','Portsmouth','NH',43.07,-70.77,4],
  ['040','Portland','ME',43.66,-70.26,8],['041','Portland','ME',43.67,-70.25,6],['042','Lewiston','ME',44.10,-70.21,4],
  ['043','Augusta','ME',44.31,-69.78,4],['044','Bangor','ME',44.80,-68.77,4],['045','Bath','ME',43.91,-69.82,3],
  ['046','Machias','ME',44.71,-67.46,1],['047','Houlton','ME',46.13,-67.84,1],['048','Rockland','ME',44.10,-69.11,2],
  ['049','Waterville','ME',44.55,-69.63,3],
  ['050','White River','VT',43.65,-72.32,3],['051','Bellows Falls','VT',43.13,-72.44,2],['052','Bennington','VT',42.88,-73.20,2],
  ['053','Brattleboro','VT',42.85,-72.56,3],['054','Burlington','VT',44.48,-73.21,6],['056','Montpelier','VT',44.26,-72.58,3],
  // Mid-Atlantic
  ['150','Pittsburgh','PA',40.44,-80.00,18],['151','Pittsburgh','PA',40.43,-79.99,14],['152','Pittsburgh','PA',40.45,-80.01,12],
  ['153','Washington','PA',40.17,-80.25,6],['154','Uniontown','PA',39.90,-79.72,4],['155','Johnstown','PA',40.33,-78.92,4],
  ['156','Greensburg','PA',40.30,-79.54,5],['157','Bedford','PA',40.02,-78.50,2],['158','DuBois','PA',41.12,-78.76,3],
  ['159','Johnstown','PA',40.34,-78.91,3],['160','New Castle','PA',41.00,-80.35,4],['161','New Castle','PA',41.01,-80.34,3],
  ['162','Sharon','PA',41.23,-80.50,3],['163','Oil City','PA',41.43,-79.70,2],['164','Erie','PA',42.13,-80.09,8],
  ['165','Erie','PA',42.14,-80.08,5],['166','Altoona','PA',40.52,-78.40,4],['167','Bradford','PA',41.96,-78.64,2],
  ['168','State College','PA',40.79,-77.86,5],['169','Williamsport','PA',41.24,-77.00,4],
  ['170','Harrisburg','PA',40.27,-76.88,10],['171','Harrisburg','PA',40.28,-76.87,7],['172','Chambersburg','PA',39.94,-77.66,4],
  ['173','York','PA',39.96,-76.73,6],['174','York','PA',39.97,-76.72,4],['175','Lancaster','PA',40.04,-76.31,8],
  ['176','Lancaster','PA',40.05,-76.30,6],['177','Williamsport','PA',41.25,-76.99,3],['178','Sunbury','PA',40.86,-76.79,3],
  ['179','Pottsville','PA',40.68,-76.20,4],['180','Lehigh Valley','PA',40.60,-75.49,14],['181','Allentown','PA',40.61,-75.47,12],
  ['182','Hazleton','PA',40.96,-75.97,4],['183','Stroudsburg','PA',41.00,-75.20,5],['184','Scranton','PA',41.41,-75.66,8],
  ['185','Scranton','PA',41.42,-75.65,6],['186','Wilkes-Barre','PA',41.25,-75.88,6],['187','Wilkes-Barre','PA',41.26,-75.87,4],
  ['188','Scranton','PA',41.40,-75.67,4],['189','Doylestown','PA',40.31,-75.13,8],['190','Philadelphia','PA',39.95,-75.17,32],
  ['191','Philadelphia','PA',39.94,-75.16,28],['192','Philadelphia','PA',39.93,-75.18,18],['193','SE PA','PA',40.10,-75.30,14],
  ['194','SE PA','PA',40.20,-75.40,10],['195','Reading','PA',40.34,-75.93,8],['196','Reading','PA',40.33,-75.94,6],
  ['197','Wilmington','DE',39.74,-75.55,10],['198','Wilmington','DE',39.75,-75.54,8],['199','Dover','DE',39.16,-75.52,4],
  ['200','Washington','DC',38.90,-77.04,22],['201','Dulles','VA',38.95,-77.45,15],['202','Washington','DC',38.91,-77.03,18],
  ['203','Washington','DC',38.89,-77.05,12],['204','Fredericksburg','VA',38.30,-77.46,6],['205','Richmond','VA',37.54,-77.44,4],
  ['206','Richmond','VA',37.55,-77.43,3],['207','Richmond','VA',37.56,-77.42,2],['208','Merrifield','VA',38.87,-77.24,14],
  ['209','Silver Spring','MD',39.00,-77.02,12],['210','Linthicum','MD',39.20,-76.67,10],['211','Columbia','MD',39.22,-76.85,12],
  ['212','Baltimore','MD',39.29,-76.61,20],['214','Annapolis','MD',38.98,-76.49,8],['215','Cumberland','MD',39.65,-78.76,3],
  ['216','Easton','MD',38.77,-76.08,3],['217','Frederick','MD',39.41,-77.41,6],['218','Salisbury','MD',38.37,-75.60,4],
  ['219','Baltimore','MD',39.28,-76.62,5],
  // Southeast
  ['220','Fairfax','VA',38.85,-77.31,16],['221','Arlington','VA',38.88,-77.10,14],['222','Arlington','VA',38.87,-77.11,12],
  ['223','Alexandria','VA',38.80,-77.05,10],['224','Staunton','VA',38.15,-79.07,4],['225','Farmville','VA',37.30,-78.39,2],
  ['226','Winchester','VA',39.19,-78.16,4],['227','Culpeper','VA',38.47,-78.01,3],['228','Charlottesville','VA',38.03,-78.48,5],
  ['229','Charlottesville','VA',38.04,-78.47,3],['230','Richmond','VA',37.54,-77.43,14],['231','Richmond','VA',37.55,-77.42,10],
  ['232','Richmond','VA',37.53,-77.44,8],['233','Norfolk','VA',36.85,-76.29,10],['234','Virginia Beach','VA',36.85,-75.98,12],
  ['235','Norfolk','VA',36.86,-76.28,6],['236','Newport News','VA',37.09,-76.47,8],['237','Newport News','VA',37.08,-76.48,5],
  ['238','Richmond','VA',37.52,-77.45,4],['239','Farmville','VA',37.30,-78.39,2],['240','Roanoke','VA',37.27,-79.94,6],
  ['241','Roanoke','VA',37.28,-79.93,4],['242','Bristol','VA',36.60,-82.19,3],['243','Pulaski','VA',37.05,-80.78,2],
  ['244','Charlottesville','VA',38.04,-78.47,3],['245','Lynchburg','VA',37.41,-79.14,5],['246','Bluefield','WV',37.27,-81.22,2],
  ['247','Bluefield','WV',37.26,-81.23,2],['248','Clarksburg','WV',39.28,-80.34,3],['249','Lewisburg','WV',37.80,-80.43,1],
  ['250','Charleston','WV',38.35,-81.63,6],['251','Charleston','WV',38.34,-81.64,4],['252','Charleston','WV',38.36,-81.62,3],
  ['253','Huntington','WV',38.42,-82.45,4],['254','Martinsburg','WV',39.46,-77.96,3],['255','Huntington','WV',38.41,-82.44,3],
  ['256','Huntington','WV',38.43,-82.43,2],['257','Huntington','WV',38.42,-82.46,2],['258','Beckley','WV',37.78,-81.19,2],
  ['259','Beckley','WV',37.77,-81.20,1],['260','Wheeling','WV',40.06,-80.72,3],['261','Parkersburg','WV',39.27,-81.56,3],
  ['262','Clarksburg','WV',39.28,-80.34,2],['263','Clarksburg','WV',39.27,-80.35,2],['264','Clarksburg','WV',39.29,-80.33,1],
  ['265','Clarksburg','WV',39.30,-80.32,1],['266','Gassaway','WV',38.67,-80.77,1],['267','Cumberland','MD',39.65,-78.76,2],
  ['268','Petersburg','WV',38.99,-79.12,1],
  ['270','Greensboro','NC',36.07,-79.79,10],['271','Winston-Salem','NC',36.10,-80.24,10],['272','Greensboro','NC',36.08,-79.78,8],
  ['273','Greensboro','NC',36.06,-79.80,6],['274','Greensboro','NC',36.09,-79.77,4],['275','Raleigh','NC',35.78,-78.64,14],
  ['276','Raleigh','NC',35.77,-78.65,12],['277','Durham','NC',35.99,-78.90,10],['278','Rocky Mount','NC',35.94,-77.79,4],
  ['279','Rocky Mount','NC',35.93,-77.80,3],['280','Charlotte','NC',35.23,-80.84,16],['281','Charlotte','NC',35.22,-80.85,12],
  ['282','Charlotte','NC',35.24,-80.83,10],['283','Fayetteville','NC',35.05,-78.88,6],['284','Wilmington','NC',34.23,-77.94,6],
  ['285','Kinston','NC',35.26,-77.58,3],['286','Hickory','NC',35.73,-81.34,4],['287','Asheville','NC',35.60,-82.55,6],
  ['288','Asheville','NC',35.59,-82.56,4],['289','Gastonia','NC',35.26,-81.19,5],
  ['290','Columbia','SC',34.00,-81.03,8],['291','Columbia','SC',33.99,-81.04,6],['292','Columbia','SC',34.01,-81.02,5],
  ['293','Greenville','SC',34.85,-82.40,10],['294','Charleston','SC',32.78,-79.93,10],['295','Florence','SC',34.20,-79.76,3],
  ['296','Greenville','SC',34.84,-82.41,6],['297','Charlotte','NC',35.21,-80.86,4],['298','Hilton Head','SC',32.22,-80.75,3],
  ['299','Savannah','GA',32.08,-81.09,6],
  ['300','Atlanta','GA',33.75,-84.39,20],['301','Atlanta','GA',33.74,-84.40,15],['302','Atlanta','GA',33.76,-84.38,12],
  ['303','Atlanta','GA',33.73,-84.41,18],['304','Swainsboro','GA',32.60,-82.33,2],['305','Athens','GA',33.96,-83.38,5],
  ['306','Athens','GA',33.97,-83.37,3],['307','Chattanooga','TN',35.05,-85.31,6],['308','Augusta','GA',33.47,-81.97,5],
  ['309','Augusta','GA',33.48,-81.96,4],['310','Macon','GA',32.84,-83.63,4],['311','Atlanta','GA',33.77,-84.37,10],
  ['312','Macon','GA',32.83,-83.64,3],['313','Savannah','GA',32.08,-81.10,5],['314','Savannah','GA',32.07,-81.11,4],
  ['315','Waycross','GA',31.21,-82.35,2],['316','Valdosta','GA',30.83,-83.28,3],['317','Albany','GA',31.58,-84.16,2],
  ['318','Columbus','GA',32.46,-84.99,4],['319','Columbus','GA',32.47,-84.98,3],
  ['320','Jacksonville','FL',30.33,-81.66,10],['321','Daytona Beach','FL',29.21,-81.02,5],['322','Jacksonville','FL',30.32,-81.65,8],
  ['323','Tallahassee','FL',30.44,-84.28,5],['324','Panama City','FL',30.16,-85.66,3],['325','Pensacola','FL',30.44,-87.19,5],
  ['326','Gainesville','FL',29.65,-82.32,5],['327','Orlando','FL',28.54,-81.38,14],['328','Orlando','FL',28.53,-81.39,12],
  ['329','Melbourne','FL',28.08,-80.61,5],['330','Miami','FL',25.76,-80.19,20],['331','Miami','FL',25.77,-80.18,15],
  ['332','Miami','FL',25.75,-80.20,14],['333','Fort Lauderdale','FL',26.12,-80.14,16],['334','W Palm Beach','FL',26.71,-80.05,10],
  ['335','Tampa','FL',27.95,-82.46,14],['336','Tampa','FL',27.94,-82.47,10],['337','St Petersburg','FL',27.77,-82.64,10],
  ['338','Lakeland','FL',28.04,-81.95,5],['339','Fort Myers','FL',26.64,-81.87,6],['340','Fort Myers','FL',26.63,-81.88,4],
  ['341','Fort Myers','FL',26.65,-81.86,3],['342','Sarasota','FL',27.34,-82.53,6],['344','Gainesville','FL',29.64,-82.33,3],
  ['346','Tampa','FL',27.96,-82.45,6],['347','Orlando','FL',28.55,-81.37,5],['349','West Palm','FL',26.72,-80.04,4],
  // South Central
  ['350','Birmingham','AL',33.52,-86.81,8],['351','Birmingham','AL',33.51,-86.82,6],['352','Tuscaloosa','AL',33.21,-87.57,4],
  ['354','Tuscaloosa','AL',33.22,-87.56,3],['355','Birmingham','AL',33.53,-86.80,4],['356','Huntsville','AL',34.73,-86.59,6],
  ['357','Huntsville','AL',34.74,-86.58,4],['358','Huntsville','AL',34.75,-86.57,3],['359','Gadsden','AL',34.01,-86.01,2],
  ['360','Montgomery','AL',32.38,-86.31,5],['361','Montgomery','AL',32.37,-86.32,3],['362','Anniston','AL',33.66,-85.83,2],
  ['363','Dothan','AL',31.22,-85.39,3],['364','Evergreen','AL',31.43,-86.95,1],['365','Mobile','AL',30.69,-88.04,5],
  ['366','Mobile','AL',30.70,-88.03,3],['367','Selma','AL',32.41,-87.02,2],['368','Selma','AL',32.42,-87.01,1],
  ['369','Meridian','MS',32.35,-88.70,2],['370','Nashville','TN',36.16,-86.78,12],['371','Nashville','TN',36.17,-86.77,8],
  ['372','Nashville','TN',36.15,-86.79,6],['373','Chattanooga','TN',35.05,-85.31,6],['374','Chattanooga','TN',35.06,-85.30,4],
  ['375','Memphis','TN',35.15,-90.05,8],['376','Johnson City','TN',36.31,-82.35,3],['377','Knoxville','TN',35.96,-83.92,7],
  ['378','Knoxville','TN',35.97,-83.91,5],['379','Knoxville','TN',35.98,-83.90,3],['380','Memphis','TN',35.14,-90.06,10],
  ['381','Memphis','TN',35.16,-90.04,6],['382','McKenzie','TN',36.13,-88.52,2],['383','Jackson','TN',35.61,-88.81,3],
  ['384','Columbia','TN',35.62,-87.04,2],['385','Cookeville','TN',36.16,-85.50,2],
  ['386','Jackson','MS',32.30,-90.18,5],['387','Greenville','MS',33.41,-91.06,2],['388','Tupelo','MS',34.26,-88.70,2],
  ['389','Grenada','MS',33.77,-89.81,1],['390','Jackson','MS',32.31,-90.17,4],['391','Jackson','MS',32.29,-90.19,3],
  ['392','Hattiesburg','MS',31.33,-89.29,3],['393','Meridian','MS',32.36,-88.69,2],['394','Laurel','MS',31.69,-89.13,2],
  ['395','Biloxi','MS',30.40,-88.88,4],['396','McComb','MS',31.24,-90.45,1],['397','Columbus','MS',33.50,-88.43,2],
  // Midwest
  ['400','Louisville','KY',38.25,-85.76,8],['401','Louisville','KY',38.26,-85.75,6],['402','Louisville','KY',38.24,-85.77,5],
  ['403','Lexington','KY',38.04,-84.50,6],['404','Lexington','KY',38.03,-84.51,4],['405','Lexington','KY',38.05,-84.49,3],
  ['406','Frankfort','KY',38.20,-84.87,3],['410','Cincinnati','OH',39.10,-84.51,10],['411','Covington','KY',39.08,-84.51,6],
  ['420','Paducah','KY',37.08,-88.60,2],['421','Bowling Green','KY',36.99,-86.44,3],['422','Danville','KY',37.65,-84.77,2],
  ['423','Pikeville','KY',37.48,-82.52,2],['424','Somerset','KY',37.09,-84.60,2],['425','London','KY',37.13,-84.08,2],
  ['426','Somerset','KY',37.10,-84.59,1],['427','Elizabethtown','KY',37.69,-85.86,2],
  ['430','Columbus','OH',39.96,-83.00,12],['431','Columbus','OH',39.97,-82.99,8],['432','Columbus','OH',39.95,-83.01,6],
  ['433','Marion','OH',40.59,-83.13,3],['434','Toledo','OH',41.66,-83.56,6],['435','Toledo','OH',41.67,-83.55,4],
  ['436','Toledo','OH',41.65,-83.57,3],['437','Zanesville','OH',39.94,-82.01,2],['438','Zanesville','OH',39.95,-82.00,2],
  ['439','Steubenville','OH',40.36,-80.63,3],['440','Cleveland','OH',41.50,-81.69,14],['441','Cleveland','OH',41.49,-81.70,10],
  ['442','Akron','OH',41.08,-81.52,8],['443','Akron','OH',41.09,-81.51,6],['444','Youngstown','OH',41.10,-80.65,5],
  ['445','Youngstown','OH',41.11,-80.64,3],['446','Canton','OH',40.80,-81.38,5],['447','Canton','OH',40.81,-81.37,3],
  ['448','Mansfield','OH',40.76,-82.52,3],['449','Mansfield','OH',40.77,-82.51,2],['450','Cincinnati','OH',39.10,-84.51,12],
  ['451','Cincinnati','OH',39.11,-84.50,8],['452','Cincinnati','OH',39.09,-84.52,6],['453','Dayton','OH',39.76,-84.19,8],
  ['454','Dayton','OH',39.77,-84.18,5],['455','Springfield','OH',39.92,-83.81,4],['456','Chillicothe','OH',39.33,-82.98,2],
  ['457','Athens','OH',39.33,-82.10,2],['458','Lima','OH',40.74,-84.11,3],['459','Cincinnati','OH',39.12,-84.49,4],
  ['460','Indianapolis','IN',39.77,-86.16,12],['461','Indianapolis','IN',39.78,-86.15,8],['462','Indianapolis','IN',39.76,-86.17,6],
  ['463','Gary','IN',41.59,-87.35,6],['464','Gary','IN',41.60,-87.34,4],['465','South Bend','IN',41.68,-86.25,5],
  ['466','South Bend','IN',41.69,-86.24,3],['467','Fort Wayne','IN',41.08,-85.14,6],['468','Fort Wayne','IN',41.09,-85.13,4],
  ['469','Kokomo','IN',40.49,-86.13,3],['470','Cincinnati','OH',39.10,-84.52,4],['471','Louisville','KY',38.25,-85.76,3],
  ['472','Columbus','IN',39.20,-85.92,3],['473','Muncie','IN',40.19,-85.39,3],['474','Bloomington','IN',39.17,-86.53,4],
  ['475','Terre Haute','IN',39.47,-87.41,3],['476','Evansville','IN',37.97,-87.56,4],['477','Evansville','IN',37.98,-87.55,3],
  ['478','Terre Haute','IN',39.48,-87.40,2],['479','Lafayette','IN',40.42,-86.87,4],
  ['480','Royal Oak','MI',42.49,-83.14,12],['481','Detroit','MI',42.33,-83.05,16],['482','Detroit','MI',42.34,-83.04,12],
  ['483','Royal Oak','MI',42.50,-83.13,8],['484','Flint','MI',43.01,-83.69,6],['485','Flint','MI',43.02,-83.68,4],
  ['486','Saginaw','MI',43.42,-83.95,4],['487','Saginaw','MI',43.43,-83.94,3],['488','Lansing','MI',42.73,-84.56,6],
  ['489','Lansing','MI',42.74,-84.55,4],['490','Kalamazoo','MI',42.29,-85.59,5],['491','Kalamazoo','MI',42.30,-85.58,3],
  ['492','Jackson','MI',42.25,-84.40,3],['493','Grand Rapids','MI',42.96,-85.66,8],['494','Grand Rapids','MI',42.97,-85.65,5],
  ['495','Grand Rapids','MI',42.98,-85.64,4],['496','Traverse City','MI',44.76,-85.62,3],['497','Gaylord','MI',45.03,-84.67,1],
  ['498','Iron Mountain','MI',45.82,-88.07,1],['499','Iron Mountain','MI',45.83,-88.06,1],
  ['500','Des Moines','IA',41.59,-93.62,6],['501','Des Moines','IA',41.60,-93.61,4],['502','Des Moines','IA',41.58,-93.63,3],
  ['503','Des Moines','IA',41.61,-93.60,2],['504','Mason City','IA',43.15,-93.20,2],['505','Fort Dodge','IA',42.50,-94.17,2],
  ['506','Waterloo','IA',42.49,-92.34,3],['507','Waterloo','IA',42.50,-92.33,2],['508','Creston','IA',41.06,-94.36,1],
  ['509','Des Moines','IA',41.57,-93.64,2],['510','Sioux City','IA',42.50,-96.40,3],['511','Sioux City','IA',42.51,-96.39,2],
  ['512','Sheldon','IA',43.18,-95.86,1],['513','Spencer','IA',43.14,-95.14,1],['514','Carroll','IA',42.07,-94.87,1],
  ['515','Omaha','NE',41.26,-95.94,5],['516','Omaha','NE',41.27,-95.93,3],['520','Dubuque','IA',42.50,-90.66,3],
  ['521','Decorah','IA',43.30,-91.79,1],['522','Cedar Rapids','IA',42.03,-91.64,5],['523','Cedar Rapids','IA',42.04,-91.63,3],
  ['524','Cedar Rapids','IA',42.02,-91.65,2],['525','Ottumwa','IA',41.02,-92.41,2],['526','Burlington','IA',40.81,-91.11,2],
  ['527','Rock Island','IL',41.51,-90.58,4],['528','Davenport','IA',41.52,-90.58,5],
  ['530','Milwaukee','WI',43.04,-87.91,10],['531','Milwaukee','WI',43.03,-87.92,8],['532','Milwaukee','WI',43.05,-87.90,6],
  ['534','Racine','WI',42.73,-87.78,5],['535','Madison','WI',43.07,-89.40,6],['537','Madison','WI',43.08,-89.39,4],
  ['538','Madison','WI',43.06,-89.41,3],['539','Portage','WI',43.54,-89.46,2],['540','St Paul','MN',44.94,-93.09,4],
  ['541','Green Bay','WI',44.51,-88.02,5],['542','Green Bay','WI',44.52,-88.01,3],['543','Green Bay','WI',44.50,-88.03,2],
  ['544','Wausau','WI',44.96,-89.63,2],['545','Rhinelander','WI',45.64,-89.41,1],['546','La Crosse','WI',43.80,-91.24,3],
  ['547','Eau Claire','WI',44.81,-91.50,3],['548','Spooner','WI',45.82,-91.89,1],['549','Oshkosh','WI',44.02,-88.54,3],
  ['550','St Paul','MN',44.95,-93.09,10],['551','St Paul','MN',44.96,-93.10,8],['553','Minneapolis','MN',44.98,-93.27,14],
  ['554','Minneapolis','MN',44.97,-93.26,10],['555','Minneapolis','MN',44.99,-93.28,6],['556','Duluth','MN',46.79,-92.10,3],
  ['557','Duluth','MN',46.80,-92.09,2],['558','Duluth','MN',46.78,-92.11,2],['559','Rochester','MN',44.02,-92.47,4],
  ['560','Mankato','MN',44.16,-94.00,2],['561','Mankato','MN',44.17,-93.99,2],['562','Willmar','MN',45.12,-95.04,1],
  ['563','St Cloud','MN',45.56,-94.16,3],['564','Brainerd','MN',46.36,-94.20,2],['565','Detroit Lakes','MN',46.82,-95.84,1],
  ['566','Bemidji','MN',47.47,-94.88,1],['567','Thief River','MN',48.12,-96.18,1],
  ['570','Sioux Falls','SD',43.55,-96.70,4],['571','Sioux Falls','SD',43.56,-96.69,3],['572','Watertown','SD',44.89,-97.12,1],
  ['573','Mitchell','SD',43.71,-98.03,1],['574','Aberdeen','SD',45.46,-98.49,1],['575','Pierre','SD',44.37,-100.35,1],
  ['576','Mobridge','SD',45.54,-100.43,1],['577','Rapid City','SD',44.08,-103.23,2],
  ['580','Fargo','ND',46.88,-96.79,3],['581','Fargo','ND',46.87,-96.80,2],['582','Grand Forks','ND',47.93,-97.03,2],
  ['583','Devils Lake','ND',48.11,-98.86,1],['584','Jamestown','ND',46.91,-98.71,1],['585','Bismarck','ND',46.81,-100.78,2],
  ['586','Dickinson','ND',46.88,-102.79,1],['587','Minot','ND',48.23,-101.29,1],['588','Williston','ND',48.15,-103.62,1],
  ['590','Billings','MT',45.78,-108.50,2],['591','Billings','MT',45.79,-108.49,2],['592','Wolf Point','MT',48.09,-105.64,1],
  ['593','Miles City','MT',46.41,-105.84,1],['594','Great Falls','MT',47.50,-111.30,2],['595','Havre','MT',48.55,-109.68,1],
  ['596','Helena','MT',46.59,-112.04,2],['597','Butte','MT',46.00,-112.53,2],['598','Missoula','MT',46.87,-114.00,3],
  ['599','Kalispell','MT',48.19,-114.32,2],
  // Chicago / Illinois
  ['600','Palatine','IL',42.11,-88.03,14],['601','Carol Stream','IL',41.91,-88.13,12],['602','Evanston','IL',42.04,-87.68,10],
  ['603','Oak Park','IL',41.89,-87.79,12],['604','S Suburbs','IL',41.52,-87.70,10],['605','SW Suburbs','IL',41.64,-87.73,10],
  ['606','Chicago','IL',41.88,-87.63,22],['607','Chicago','IL',41.87,-87.64,16],['608','Chicago','IL',41.86,-87.65,12],
  ['609','Kankakee','IL',41.12,-87.86,3],['610','Rockford','IL',42.27,-89.09,5],['611','Rockford','IL',42.28,-89.08,3],
  ['612','Rock Island','IL',41.51,-90.58,4],['613','La Salle','IL',41.34,-89.09,2],['614','Galesburg','IL',40.95,-90.37,2],
  ['615','Peoria','IL',40.69,-89.59,5],['616','Peoria','IL',40.70,-89.58,3],['617','Bloomington','IL',40.48,-88.99,4],
  ['618','Champaign','IL',40.12,-88.24,4],['619','Champaign','IL',40.11,-88.25,3],['620','E St Louis','IL',38.62,-90.15,6],
  ['622','E St Louis','IL',38.63,-90.14,4],['623','Quincy','IL',39.93,-91.38,2],['624','Effingham','IL',39.12,-88.54,2],
  ['625','Springfield','IL',39.80,-89.65,5],['626','Springfield','IL',39.81,-89.64,3],['627','Springfield','IL',39.79,-89.66,2],
  ['628','Centralia','IL',38.53,-89.13,2],['629','Carbondale','IL',37.73,-89.22,3],
  // Texas
  ['700','New Orleans','LA',29.95,-90.07,10],['701','New Orleans','LA',29.96,-90.06,8],['703','Thibodaux','LA',29.80,-90.82,3],
  ['704','Hammond','LA',30.50,-90.46,3],['706','Lake Charles','LA',30.23,-93.22,3],['707','Baton Rouge','LA',30.45,-91.19,6],
  ['708','Baton Rouge','LA',30.46,-91.18,4],['710','Shreveport','LA',32.51,-93.75,4],['711','Shreveport','LA',32.52,-93.74,3],
  ['712','Monroe','LA',32.51,-92.12,3],['713','Alexandria','LA',31.31,-92.45,2],['714','Alexandria','LA',31.32,-92.44,2],
  ['716','Pine Bluff','AR',34.23,-92.00,2],['717','Camden','AR',33.58,-92.83,1],['718','Texarkana','AR',33.44,-94.05,2],
  ['719','Hot Springs','AR',34.50,-93.06,2],['720','Little Rock','AR',34.75,-92.29,5],['721','Little Rock','AR',34.74,-92.30,4],
  ['722','Little Rock','AR',34.76,-92.28,3],['723','Memphis','TN',35.13,-90.07,3],['724','Jonesboro','AR',35.84,-90.70,2],
  ['725','Batesville','AR',35.77,-91.64,1],['726','Harrison','AR',36.23,-93.11,1],['727','Fayetteville','AR',36.06,-94.16,3],
  ['728','Russellville','AR',35.28,-93.13,2],['729','Fort Smith','AR',35.39,-94.40,3],
  ['730','Oklahoma City','OK',35.47,-97.52,6],['731','Oklahoma City','OK',35.48,-97.51,4],['733','Austin TX','TX',30.27,-97.74,2],
  ['734','Ardmore','OK',34.17,-97.14,2],['735','Lawton','OK',34.60,-98.39,2],['736','Clinton','OK',35.52,-99.00,1],
  ['737','Enid','OK',36.40,-97.88,2],['738','Woodward','OK',36.43,-99.39,1],['739','Guymon','OK',36.69,-101.48,1],
  ['740','Tulsa','OK',36.15,-95.99,6],['741','Tulsa','OK',36.16,-95.98,4],['743','Tulsa','OK',36.14,-96.00,3],
  ['744','Muskogee','OK',35.75,-95.37,2],['745','McAlester','OK',34.93,-95.77,2],['746','Ponca City','OK',36.71,-97.09,2],
  ['747','Durant','OK',34.00,-96.39,1],['748','Shawnee','OK',35.33,-96.93,2],['749','Poteau','OK',35.05,-94.62,1],
  ['750','Dallas','TX',32.78,-96.80,16],['751','Dallas','TX',32.79,-96.79,10],['752','Dallas','TX',32.77,-96.81,8],
  ['753','Dallas','TX',32.80,-96.78,6],['754','Greenville','TX',33.14,-96.11,2],['755','Texarkana','TX',33.43,-94.05,2],
  ['756','Longview','TX',32.50,-94.74,3],['757','Tyler','TX',32.35,-95.30,3],['758','Palestine','TX',31.76,-95.63,1],
  ['759','Lufkin','TX',31.34,-94.73,2],['760','Fort Worth','TX',32.75,-97.33,12],['761','Fort Worth','TX',32.76,-97.32,8],
  ['762','Denton','TX',33.21,-97.13,5],['763','Wichita Falls','TX',33.91,-98.49,2],['764','Stephenville','TX',32.22,-98.20,1],
  ['765','Waco','TX',31.55,-97.15,4],['766','Waco','TX',31.56,-97.14,3],['767','Waco','TX',31.54,-97.16,2],
  ['768','Abilene','TX',32.45,-99.73,2],['769','San Angelo','TX',31.46,-100.44,2],
  ['770','Houston','TX',29.76,-95.37,18],['771','Houston','TX',29.77,-95.36,14],['772','Houston','TX',29.75,-95.38,10],
  ['773','Conroe','TX',30.31,-95.46,5],['774','Richmond','TX',29.58,-95.76,4],['775','Galveston','TX',29.30,-94.80,4],
  ['776','Beaumont','TX',30.09,-94.10,4],['777','Beaumont','TX',30.10,-94.09,3],['778','Bryan','TX',30.67,-96.37,3],
  ['779','Victoria','TX',28.81,-96.99,2],['780','San Antonio','TX',29.42,-98.49,10],['781','San Antonio','TX',29.43,-98.48,8],
  ['782','San Antonio','TX',29.44,-98.47,6],['783','Corpus Christi','TX',27.80,-97.40,4],['784','Corpus Christi','TX',27.81,-97.39,3],
  ['785','McAllen','TX',26.20,-98.23,4],['786','Austin','TX',30.27,-97.74,10],['787','Austin','TX',30.28,-97.73,8],
  ['788','San Marcos','TX',29.88,-97.94,3],['789','Giddings','TX',30.18,-96.94,1],['790','Amarillo','TX',35.22,-101.83,2],
  ['791','Amarillo','TX',35.23,-101.82,2],['792','Childress','TX',34.43,-100.20,1],['793','Lubbock','TX',33.58,-101.85,3],
  ['794','Lubbock','TX',33.57,-101.86,2],['795','Abilene','TX',32.45,-99.74,2],['796','Abilene','TX',32.44,-99.75,1],
  ['797','Midland','TX',31.99,-102.08,2],['798','El Paso','TX',31.76,-106.49,5],['799','El Paso','TX',31.77,-106.48,4],
  // West
  ['800','Denver','CO',39.74,-104.99,10],['801','Denver','CO',39.73,-105.00,8],['802','Denver','CO',39.75,-104.98,6],
  ['803','Boulder','CO',40.01,-105.27,5],['804','Denver','CO',39.76,-104.97,4],['805','Longmont','CO',40.17,-105.10,3],
  ['806','Denver','CO',39.72,-105.01,3],['807','Denver','CO',39.71,-105.02,2],['808','Colorado Springs','CO',38.83,-104.82,5],
  ['809','Colorado Springs','CO',38.84,-104.81,3],['810','Colorado Springs','CO',38.82,-104.83,2],['811','Alamosa','CO',37.47,-105.87,1],
  ['812','Salida','CO',38.53,-106.00,1],['813','Durango','CO',37.28,-107.88,1],['814','Grand Junction','CO',39.06,-108.55,2],
  ['815','Grand Junction','CO',39.07,-108.54,1],['816','Glenwood Springs','CO',39.55,-107.32,1],
  ['820','Cheyenne','WY',41.14,-104.82,2],['821','Yellowstone','WY',44.43,-110.59,1],['822','Wheatland','WY',42.05,-104.95,1],
  ['823','Rawlins','WY',41.79,-107.24,1],['824','Worland','WY',44.02,-107.95,1],['825','Riverton','WY',42.86,-108.38,1],
  ['826','Casper','WY',42.87,-106.31,2],['827','Gillette','WY',44.29,-105.50,1],['828','Sheridan','WY',44.80,-106.96,1],['829','Rock Springs','WY',41.59,-109.22,1],
  ['830','Salt Lake','UT',40.76,-111.89,8],['831','Salt Lake','UT',40.77,-111.88,5],['832','Pocatello','ID',42.87,-112.44,2],
  ['833','Twin Falls','ID',42.56,-114.47,2],['834','Idaho Falls','ID',43.47,-112.03,2],['835','Lewiston','ID',46.42,-117.02,2],
  ['836','Boise','ID',43.62,-116.21,4],['837','Boise','ID',43.63,-116.20,3],['838','Spokane','WA',47.66,-117.43,4],
  ['840','Salt Lake','UT',40.75,-111.90,6],['841','Salt Lake','UT',40.74,-111.91,4],['842','Ogden','UT',41.22,-111.97,3],
  ['843','Ogden','UT',41.23,-111.96,2],['844','Ogden','UT',41.21,-111.98,2],['845','Provo','UT',40.23,-111.66,4],
  ['846','Provo','UT',40.24,-111.65,3],['847','Provo','UT',40.22,-111.67,2],
  ['850','Phoenix','AZ',33.45,-112.07,12],['852','Phoenix','AZ',33.44,-112.08,10],['853','Phoenix','AZ',33.43,-112.09,8],
  ['855','Globe','AZ',33.39,-110.79,1],['856','Tucson','AZ',32.22,-110.93,5],['857','Tucson','AZ',32.23,-110.92,3],
  ['859','Show Low','AZ',34.25,-110.03,1],['860','Phoenix','AZ',33.46,-112.06,5],['863','Prescott','AZ',34.54,-112.47,2],
  ['864','Kingman','AZ',35.19,-114.05,1],['865','Flagstaff','AZ',35.20,-111.65,2],
  ['870','Albuquerque','NM',35.08,-106.65,5],['871','Albuquerque','NM',35.09,-106.64,3],['872','Albuquerque','NM',35.07,-106.66,2],
  ['873','Gallup','NM',35.53,-108.74,1],['874','Farmington','NM',36.73,-108.22,1],['875','Santa Fe','NM',35.69,-105.94,3],
  ['877','Las Vegas','NM',35.60,-105.22,1],['878','Socorro','NM',34.06,-106.89,1],['879','Truth or Cons','NM',33.13,-107.25,1],
  ['880','Las Cruces','NM',32.35,-106.76,3],['881','Clovis','NM',34.40,-103.20,1],['882','Roswell','NM',33.39,-104.52,2],
  ['883','Carrizozo','NM',33.64,-105.88,1],['884','Tucumcari','NM',35.17,-103.73,1],
  ['889','Las Vegas','NV',36.17,-115.14,10],['890','Las Vegas','NV',36.16,-115.15,8],['891','Las Vegas','NV',36.18,-115.13,5],
  ['893','Ely','NV',39.25,-114.89,1],['894','Reno','NV',39.53,-119.81,4],['895','Reno','NV',39.54,-119.80,3],
  ['897','Carson City','NV',39.16,-119.77,2],['898','Elko','NV',40.83,-115.76,1],
  // Pacific
  ['900','Los Angeles','CA',34.05,-118.24,22],['901','Los Angeles','CA',34.04,-118.25,18],['902','Inglewood','CA',33.96,-118.35,14],
  ['903','Inglewood','CA',33.95,-118.36,10],['904','Santa Monica','CA',34.02,-118.49,12],['905','Torrance','CA',33.84,-118.34,10],
  ['906','Whittier','CA',33.98,-118.03,8],['907','Long Beach','CA',33.77,-118.19,12],['908','Long Beach','CA',33.78,-118.18,8],
  ['910','Pasadena','CA',34.15,-118.14,8],['911','Pasadena','CA',34.14,-118.15,6],['912','Glendale','CA',34.14,-118.26,8],
  ['913','Van Nuys','CA',34.19,-118.45,10],['914','Van Nuys','CA',34.18,-118.46,8],['915','Burbank','CA',34.18,-118.31,6],
  ['916','N Hollywood','CA',34.17,-118.38,6],['917','Alhambra','CA',34.10,-118.13,6],['918','Alhambra','CA',34.09,-118.14,5],
  ['919','San Gabriel','CA',34.10,-118.10,5],['920','San Diego','CA',32.72,-117.16,12],['921','San Diego','CA',32.71,-117.17,10],
  ['922','Escondido','CA',33.12,-117.09,5],['923','San Bernardino','CA',34.11,-117.29,6],['924','San Bernardino','CA',34.10,-117.30,5],
  ['925','Riverside','CA',33.95,-117.40,8],['926','Santa Ana','CA',33.75,-117.87,10],['927','Santa Ana','CA',33.74,-117.88,8],
  ['928','Anaheim','CA',33.84,-117.91,10],['930','Ventura','CA',34.28,-119.29,4],['931','Santa Barbara','CA',34.42,-119.70,4],
  ['932','Bakersfield','CA',35.37,-119.02,5],['933','Bakersfield','CA',35.38,-119.01,3],['934','Santa Barbara','CA',34.41,-119.71,3],
  ['935','Mojave','CA',35.05,-118.17,1],['936','Fresno','CA',36.74,-119.77,6],['937','Fresno','CA',36.75,-119.76,4],
  ['938','Fresno','CA',36.73,-119.78,3],['939','Salinas','CA',36.67,-121.66,3],['940','San Francisco','CA',37.77,-122.42,14],
  ['941','San Francisco','CA',37.78,-122.41,12],['942','Sacramento','CA',38.58,-121.49,3],['943','Palo Alto','CA',37.44,-122.14,8],
  ['944','San Mateo','CA',37.56,-122.32,8],['945','Oakland','CA',37.80,-122.27,10],['946','Oakland','CA',37.81,-122.26,8],
  ['947','Berkeley','CA',37.87,-122.27,6],['948','Richmond','CA',37.94,-122.35,5],['949','San Rafael','CA',37.97,-122.53,4],
  ['950','San Jose','CA',37.34,-121.89,12],['951','San Jose','CA',37.33,-121.90,8],['952','Stockton','CA',37.95,-121.29,5],
  ['953','Stockton','CA',37.96,-121.28,3],['954','Santa Rosa','CA',38.44,-122.71,4],['955','Eureka','CA',40.80,-124.16,2],
  ['956','Sacramento','CA',38.58,-121.49,8],['957','Sacramento','CA',38.59,-121.48,5],['958','Sacramento','CA',38.57,-121.50,4],
  ['959','Marysville','CA',39.15,-121.59,2],['960','Redding','CA',40.59,-122.39,2],['961','Reno','NV',39.53,-119.81,2],
  // Pacific NW / Hawaii / Alaska
  ['970','Portland','OR',45.52,-122.68,8],['971','Portland','OR',45.53,-122.67,6],['972','Portland','OR',45.51,-122.69,5],
  ['973','Salem','OR',44.94,-123.03,4],['974','Eugene','OR',44.05,-123.09,4],['975','Medford','OR',42.33,-122.87,3],
  ['976','Klamath Falls','OR',42.19,-121.74,1],['977','Bend','OR',44.06,-121.31,2],['978','Pendleton','OR',45.67,-118.79,1],
  ['979','Boise','ID',43.61,-116.22,2],
  ['980','Seattle','WA',47.61,-122.33,12],['981','Seattle','WA',47.62,-122.32,10],['982','Everett','WA',47.98,-122.20,5],
  ['983','Tacoma','WA',47.25,-122.44,6],['984','Tacoma','WA',47.26,-122.43,4],['985','Olympia','WA',47.04,-122.90,3],
  ['986','Portland','OR',45.52,-122.67,3],['988','Wenatchee','WA',47.42,-120.31,1],['989','Yakima','WA',46.60,-120.51,2],
  ['990','Spokane','WA',47.66,-117.43,4],['991','Spokane','WA',47.67,-117.42,3],['992','Spokane','WA',47.65,-117.44,2],
  ['993','Pasco','WA',46.24,-119.10,2],['994','Lewiston','ID',46.42,-117.01,1],
  ['967','Honolulu','HI',21.31,-157.86,6],['968','Honolulu','HI',21.30,-157.87,4],
  ['995','Anchorage','AK',61.22,-149.90,3],['996','Anchorage','AK',61.21,-149.91,2],['997','Fairbanks','AK',64.84,-147.72,1],['998','Juneau','AK',58.30,-134.42,1],['999','Ketchikan','AK',55.34,-131.64,1]
];

// ── Business Archetype Definitions ──
var NETOPT_ARCHETYPES = {
  dtc_national: {
    name: 'DTC E-Commerce — National',
    desc: 'Population-weighted, national',
    modeMix: { tl: 5, ltl: 10, parcel: 85 },
    topRegion: 'Northeast 28%',
    zipCount: 200,
    regionWeights: { ne: 1.3, se: 1.0, mw: 0.9, sw: 0.8, w: 1.1 },
    popExponent: 1.1, maxDays: 3
  },
  dtc_east: {
    name: 'DTC E-Commerce — East Coast Heavy',
    desc: 'Concentrated East Coast / BosWash corridor',
    modeMix: { tl: 5, ltl: 8, parcel: 87 },
    topRegion: 'Northeast 45%',
    zipCount: 180,
    regionWeights: { ne: 2.2, se: 1.2, mw: 0.5, sw: 0.3, w: 0.4 },
    popExponent: 1.2, maxDays: 2
  },
  dtc_west: {
    name: 'DTC E-Commerce — West Coast Heavy',
    desc: 'Concentrated West Coast / CA+WA+OR',
    modeMix: { tl: 5, ltl: 8, parcel: 87 },
    topRegion: 'West 48%',
    zipCount: 180,
    regionWeights: { ne: 0.5, se: 0.4, mw: 0.3, sw: 0.6, w: 2.5 },
    popExponent: 1.2, maxDays: 2
  },
  cpg_bigbox: {
    name: 'CPG → Big Box Retail',
    desc: 'Walmart/Target/Costco store distribution',
    modeMix: { tl: 60, ltl: 30, parcel: 10 },
    topRegion: 'South 30%',
    zipCount: 120,
    regionWeights: { ne: 0.9, se: 1.2, mw: 1.1, sw: 1.0, w: 0.8 },
    popExponent: 0.7, maxDays: 5
  },
  cpg_grocery: {
    name: 'CPG → Grocery Chains',
    desc: 'Kroger/Publix/Albertsons DC distribution',
    modeMix: { tl: 55, ltl: 35, parcel: 10 },
    topRegion: 'Midwest 25%',
    zipCount: 100,
    regionWeights: { ne: 1.0, se: 1.1, mw: 1.2, sw: 0.8, w: 0.9 },
    popExponent: 0.6, maxDays: 5
  },
  industrial: {
    name: 'Industrial / MRO Distribution',
    desc: 'Manufacturing belt heavy, B2B',
    modeMix: { tl: 30, ltl: 50, parcel: 20 },
    topRegion: 'Midwest 35%',
    zipCount: 150,
    regionWeights: { ne: 0.8, se: 0.7, mw: 1.8, sw: 0.6, w: 0.5 },
    popExponent: 0.5, maxDays: 5
  },
  food_bev: {
    name: 'Food & Beverage',
    desc: 'Population-weighted, cold chain',
    modeMix: { tl: 45, ltl: 40, parcel: 15 },
    topRegion: 'Northeast 28%',
    zipCount: 160,
    regionWeights: { ne: 1.2, se: 1.1, mw: 1.0, sw: 0.8, w: 1.0 },
    popExponent: 1.0, maxDays: 2
  },
  healthcare: {
    name: 'Healthcare / Pharma',
    desc: 'Hospital & pharmacy distribution',
    modeMix: { tl: 15, ltl: 25, parcel: 60 },
    topRegion: 'Northeast 30%',
    zipCount: 180,
    regionWeights: { ne: 1.4, se: 1.0, mw: 0.9, sw: 0.7, w: 1.0 },
    popExponent: 1.1, maxDays: 1
  },
  auto_parts: {
    name: 'Auto Parts / Aftermarket',
    desc: 'Broad distribution, vehicle-density weighted',
    modeMix: { tl: 35, ltl: 40, parcel: 25 },
    topRegion: 'South 28%',
    zipCount: 170,
    regionWeights: { ne: 0.9, se: 1.2, mw: 1.1, sw: 1.0, w: 0.9 },
    popExponent: 0.8, maxDays: 3
  },
  bto_tech: {
    name: 'Build-to-Order / Tech',
    desc: 'Tech hubs + metro areas, high parcel mix',
    modeMix: { tl: 10, ltl: 15, parcel: 75 },
    topRegion: 'West 35%',
    zipCount: 160,
    regionWeights: { ne: 1.1, se: 0.7, mw: 0.6, sw: 0.8, w: 1.6 },
    popExponent: 1.3, maxDays: 3
  }
};

// Determine region from state abbreviation
function netoptGetRegion(state) {
  var ne = ['CT','DE','DC','MA','MD','ME','NH','NJ','NY','PA','RI','VT','VA','WV'];
  var se = ['AL','FL','GA','KY','LA','MS','NC','SC','TN','AR'];
  var mw = ['IA','IL','IN','KS','MI','MN','MO','ND','NE','OH','OK','SD','WI'];
  var sw = ['AZ','NM','TX'];
  var w = ['AK','CA','CO','HI','ID','MT','NV','OR','UT','WA','WY'];
  if (ne.indexOf(state) >= 0) return 'ne';
  if (se.indexOf(state) >= 0) return 'se';
  if (mw.indexOf(state) >= 0) return 'mw';
  if (sw.indexOf(state) >= 0) return 'sw';
  if (w.indexOf(state) >= 0) return 'w';
  return 'mw'; // default
}

// Update archetype preview card
function netoptUpdateArchetypePreview() {
  var arch = NETOPT_ARCHETYPES[document.getElementById('netopt-demo-archetype').value];
  if (!arch) return;
  var distDesc = document.getElementById('netopt-demo-dist-desc');
  var modeDesc = document.getElementById('netopt-demo-mode-desc');
  var zipCount = document.getElementById('netopt-demo-zip-count');
  var topRegion = document.getElementById('netopt-demo-top-region');
  if (distDesc) distDesc.textContent = arch.desc;
  if (modeDesc) modeDesc.textContent = arch.modeMix.tl + '% / ' + arch.modeMix.ltl + '% / ' + arch.modeMix.parcel + '%';
  if (zipCount) zipCount.textContent = '~' + arch.zipCount + ' demand points';
  if (topRegion) topRegion.textContent = arch.topRegion;
}

// Generate demo demand data
function netoptGenerateDemoDemand() {
  var archetypeKey = document.getElementById('netopt-demo-archetype').value;
  var totalVolume = parseFloat(document.getElementById('netopt-demo-volume').value) || 5000000;
  var sla = parseFloat(document.getElementById('netopt-demo-sla').value) || 500;
  var arch = NETOPT_ARCHETYPES[archetypeKey];
  if (!arch) return;

  var status = document.getElementById('netopt-demo-status');
  if (status) status.textContent = 'Generating...';

  // Step 1: Calculate weighted scores for each ZIP3
  var scored = [];
  NETOPT_ZIP3_DB.forEach(function(z) {
    var zip3 = z[0], city = z[1], state = z[2], lat = z[3], lng = z[4], popIdx = z[5];
    var region = netoptGetRegion(state);
    var regionWeight = arch.regionWeights[region] || 1.0;
    var score = Math.pow(popIdx, arch.popExponent) * regionWeight;
    // Add small random noise (±15%) for realism
    score *= (0.85 + Math.random() * 0.30);
    if (score > 0.5) { // min threshold
      scored.push({ zip3: zip3, city: city, state: state, lat: lat, lng: lng, score: score });
    }
  });

  // Step 2: Sort by score, take top N
  scored.sort(function(a, b) { return b.score - a.score; });
  var maxPoints = Math.min(arch.zipCount, scored.length);
  var selected = scored.slice(0, maxPoints);

  // Step 3: Normalize scores and distribute volume
  var totalScore = selected.reduce(function(s, z) { return s + z.score; }, 0);
  var demandPoints = [];
  selected.forEach(function(z, i) {
    var pct = z.score / totalScore;
    var volume = Math.round(totalVolume * pct / 1000); // Convert to K units
    if (volume < 1) volume = 1;
    demandPoints.push({
      id: 'dem-' + Date.now() + '-' + i,
      city: z.city + ', ' + z.state,
      state: z.state,
      volume: volume,
      maxMiles: sla,
      maxDays: arch.maxDays || 3,
      lat: z.lat,
      lng: z.lng,
      zip3: z.zip3
    });
  });

  // Step 4: Apply to netoptState
  netoptState.demands = demandPoints;
  netoptRenderDemandsTable();
  netoptUpdateKPI();

  // Step 5: Set mode mix from archetype
  document.getElementById('netopt-mode-tl-pct').value = arch.modeMix.tl;
  document.getElementById('netopt-mode-ltl-pct').value = arch.modeMix.ltl;
  document.getElementById('netopt-mode-parcel-pct').value = arch.modeMix.parcel;
  netoptBalanceModeMix('tl');

  if (status) {
    status.textContent = 'Generated ' + demandPoints.length + ' demand points (' + fmtNum(totalVolume / 1000000, 1) + 'M units). Mode mix set to ' + arch.modeMix.tl + '/' + arch.modeMix.ltl + '/' + arch.modeMix.parcel + ' (TL/LTL/Parcel).';
    status.style.color = 'var(--ies-green)';
  }

  // Auto-switch to Demand tab after 1.5s
  setTimeout(function() { netoptSwitchTab('demand'); }, 1500);
}

// Pre-defined facility candidates (10 major US warehouse cities)
var NETOPT_FACILITY_CANDIDATES = [
  {name: 'Atlanta', city: 'Atlanta, GA', capacity: 800, fixedCost: 3.2, varCost: 0.25},
  {name: 'Chicago', city: 'Chicago, IL', capacity: 750, fixedCost: 3.0, varCost: 0.24},
  {name: 'Dallas', city: 'Dallas, TX', capacity: 650, fixedCost: 2.8, varCost: 0.23},
  {name: 'Los Angeles', city: 'Los Angeles, CA', capacity: 700, fixedCost: 3.1, varCost: 0.26},
  {name: 'Memphis', city: 'Memphis, TN', capacity: 600, fixedCost: 2.5, varCost: 0.22},
  {name: 'Columbus', city: 'Columbus, OH', capacity: 550, fixedCost: 2.4, varCost: 0.21},
  {name: 'Indianapolis', city: 'Indianapolis, IN', capacity: 550, fixedCost: 2.3, varCost: 0.20},
  {name: 'Allentown', city: 'Allentown, PA', capacity: 600, fixedCost: 2.7, varCost: 0.25},
  {name: 'Savannah', city: 'Savannah, GA', capacity: 500, fixedCost: 2.2, varCost: 0.21},
  {name: 'Reno', city: 'Reno, NV', capacity: 400, fixedCost: 1.8, varCost: 0.24}
];

// Pre-defined major demand points (15 cities)
var NETOPT_DEMAND_POINTS = [
  {city: 'New York, NY', volume: 320},
  {city: 'Los Angeles, CA', volume: 280},
  {city: 'Chicago, IL', volume: 210},
  {city: 'Houston, TX', volume: 180},
  {city: 'Phoenix, AZ', volume: 150},
  {city: 'Philadelphia, PA', volume: 140},
  {city: 'San Antonio, TX', volume: 130},
  {city: 'San Diego, CA', volume: 120},
  {city: 'Dallas, TX', volume: 150},
  {city: 'San Jose, CA', volume: 110},
  {city: 'Austin, TX', volume: 95},
  {city: 'Jacksonville, FL', volume: 100},
  {city: 'Fort Worth, TX', volume: 90},
  {city: 'Columbus, OH', volume: 85},
  {city: 'Charlotte, NC', volume: 95}
];

// Initialize Network Optimization tool
function netoptInit() {
  netoptState.facilities = [];
  netoptState.demands = [];
  netoptUpdateKPI();
}

// Load quick-start template
function netoptLoadTemplate(templateName) {
  netoptState.facilities = [];
  netoptState.demands = [];

  if (templateName === 'us-2dc') {
    // Atlanta, Chicago
    netoptState.facilities = [
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Atlanta'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Chicago')
    ].map((f, i) => ({...f, id: 'fac-' + i, status: 'Candidate', lat: null, lng: null}));
    netoptState.demands = NETOPT_DEMAND_POINTS.slice(0, 8).map((d, i) => ({...d, id: 'dem-' + i, state: '', maxMiles: 500, lat: null, lng: null}));
  } else if (templateName === 'us-3dc') {
    // Atlanta, Chicago, LA
    netoptState.facilities = [
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Atlanta'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Chicago'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Los Angeles')
    ].map((f, i) => ({...f, id: 'fac-' + i, status: 'Candidate', lat: null, lng: null}));
    netoptState.demands = NETOPT_DEMAND_POINTS.slice(0, 10).map((d, i) => ({...d, id: 'dem-' + i, state: '', maxMiles: 500, lat: null, lng: null}));
  } else if (templateName === 'us-4dc') {
    // Atlanta, Chicago, LA, Dallas
    netoptState.facilities = [
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Atlanta'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Chicago'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Los Angeles'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Dallas')
    ].map((f, i) => ({...f, id: 'fac-' + i, status: 'Candidate', lat: null, lng: null}));
    netoptState.demands = NETOPT_DEMAND_POINTS.map((d, i) => ({...d, id: 'dem-' + i, state: '', maxMiles: 500, lat: null, lng: null}));
  } else if (templateName === 'custom') {
    netoptState.facilities = [];
    netoptState.demands = [];
  }

  // Geocode coordinates
  netoptState.facilities.forEach(f => {
    var g = geocodeCity(f.city);
    if (g) { f.lat = g.lat; f.lng = g.lng; }
  });
  netoptState.demands.forEach(d => {
    var parts = d.city.split(', ');
    if (parts.length === 2) { d.state = parts[1]; }
    var g = geocodeCity(d.city);
    if (g) { d.lat = g.lat; d.lng = g.lng; }
  });

  netoptRenderTables();
  netoptUpdateKPI();
  netoptSwitchTab('facilities');
}

// Switch tab
function netoptSwitchTab(tabName) {
  netoptState.activeTab = tabName;

  // Hide all tabs
  document.querySelectorAll('.netopt-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('#netopt-tabs .wsc-tab').forEach(el => el.classList.remove('active'));

  // Show active tab
  var tabEl = document.getElementById('netopt-tab-' + tabName);
  if (tabEl) tabEl.style.display = 'block';

  // Mark tab button as active
  var btns = document.querySelectorAll('#netopt-tabs .wsc-tab');
  var btnNames = ['setup', 'facilities', 'demand', 'transportation', 'constraints', 'results'];
  btns.forEach((btn, i) => {
    if (btnNames[i] === tabName) btn.classList.add('active');
  });

  // Initialize map on first results view
  if (tabName === 'results' && !netoptState.mapInitialized && netoptState.results) {
    setTimeout(() => netoptInitializeMap(), 100);
  }

  // Auto-scroll to results content
  if (tabName === 'results' && netoptState.results) {
    setTimeout(function() {
      var content = document.getElementById('netopt-results-content');
      if (content && content.style.display !== 'none') {
        content.scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    }, 100);
  }

  // Auto-fetch freight rates on first Transportation tab visit
  if (tabName === 'transportation' && !netoptMarketRates.lastUpdated) {
    netoptFetchFreightRates();
  }
}

// Render facilities table
function netoptRenderFacilitiesTable() {
  var tbody = document.getElementById('netopt-facilities-tbody');
  tbody.innerHTML = '';
  netoptState.facilities.forEach(f => {
    var row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--ies-gray-200)';
    var fid = esc(f.id);
    row.innerHTML = `
      <td style="padding:12px 16px;"><input type="text" value="${esc(f.name)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).name=this.value;"></td>
      <td style="padding:12px 16px;"><input type="text" value="${esc(f.city)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).city=this.value;netoptGeocodeFacility('${fid}');"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${f.capacity}" min="100" step="50" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).capacity=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${f.fixedCost}" min="0" step="0.1" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).fixedCost=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${f.varCost}" min="0" step="0.01" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).varCost=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:center;">
        <select class="wsc-select" style="width:100%;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).status=this.value;">
          <option ${f.status==='Candidate'?'selected':''}>Candidate</option>
          <option ${f.status==='Locked Open'?'selected':''}>Locked Open</option>
        </select>
      </td>
      <td style="padding:12px 16px;text-align:center;"><button onclick="netoptRemoveFacility('${fid}')" style="padding:4px 8px;background:#fff;border:1px solid var(--ies-red);color:var(--ies-red);border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Remove</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Render demands table
function netoptRenderDemandsTable() {
  var tbody = document.getElementById('netopt-demands-tbody');
  tbody.innerHTML = '';
  netoptState.demands.forEach(d => {
    var row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--ies-gray-200)';
    var did = esc(d.id);
    row.innerHTML = `
      <td style="padding:12px 16px;"><input type="text" value="${esc(d.city)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).city=this.value;netoptGeocideDemand('${did}');"></td>
      <td style="padding:12px 16px;"><input type="text" value="${esc(d.state)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).state=this.value;"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${d.volume}" min="1" step="10" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).volume=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${d.maxMiles}" min="50" step="50" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).maxMiles=parseFloat(this.value);"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${d.maxDays || 3}" min="1" max="7" step="1" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).maxDays=parseInt(this.value, 10);"></td>
      <td style="padding:12px 16px;text-align:center;"><button onclick="netoptRemoveDemand('${did}')" style="padding:4px 8px;background:#fff;border:1px solid var(--ies-red);color:var(--ies-red);border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Remove</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Render both tables
function netoptRenderTables() {
  netoptRenderFacilitiesTable();
  netoptRenderDemandsTable();
}

// Add facility row
function netoptAddFacility() {
  var id = 'fac-' + Date.now();
  netoptState.facilities.push({
    id: id,
    name: 'New Facility',
    city: 'Atlanta, GA',
    capacity: 500,
    fixedCost: 2.5,
    varCost: 0.23,
    status: 'Candidate',
    lat: null,
    lng: null
  });
  netoptRenderFacilitiesTable();
  var g = geocodeCity('Atlanta, GA');
  if (g) {
    var f = netoptState.facilities.find(x => x.id === id);
    f.lat = g.lat;
    f.lng = g.lng;
  }
}

// Add demand row
function netoptAddDemandPoint() {
  if (typeof markDirty === 'function') markDirty('Network Optimization');
  var id = 'dem-' + Date.now();
  netoptState.demands.push({
    id: id,
    city: 'New York, NY',
    state: 'NY',
    volume: 100,
    maxMiles: 500,
    maxDays: 3,
    lat: null,
    lng: null
  });
  netoptRenderDemandsTable();
  var g = geocodeCity('New York, NY');
  if (g) {
    var d = netoptState.demands.find(x => x.id === id);
    d.lat = g.lat;
    d.lng = g.lng;
  }
}

// Remove facility
function netoptRemoveFacility(id) {
  netoptState.facilities = netoptState.facilities.filter(f => f.id !== id);
  netoptRenderFacilitiesTable();
  netoptUpdateKPI();
}

// Remove demand
function netoptRemoveDemand(id) {
  netoptState.demands = netoptState.demands.filter(d => d.id !== id);
  netoptRenderDemandsTable();
  netoptUpdateKPI();
}

// B5: Supplier/Origin point management
function netoptAddSupplier() {
  var id = 'sup-' + Date.now();
  netoptState.suppliers.push({
    id: id,
    city: 'Los Angeles, CA',
    volume: 200,
    mode: 'TL',
    lat: null,
    lng: null
  });
  netoptRenderSuppliersTable();
  var g = geocodeCity('Los Angeles, CA');
  if (g) {
    var s = netoptState.suppliers.find(function(x) { return x.id === id; });
    if (s) { s.lat = g.lat; s.lng = g.lng; }
  }
}

function netoptRemoveSupplier(id) {
  netoptState.suppliers = netoptState.suppliers.filter(function(s) { return s.id !== id; });
  netoptRenderSuppliersTable();
}

function netoptRenderSuppliersTable() {
  var tbody = document.getElementById('netopt-suppliers-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  netoptState.suppliers.forEach(function(s) {
    var row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--ies-gray-200)';
    var sid = esc(s.id);
    row.innerHTML =
      '<td style="padding:12px 16px;"><input type="text" value="' + esc(s.city) + '" class="wsc-input" style="width:100%;font-size:12px;" onchange="var sup=netoptState.suppliers.find(function(x){return x.id===\'' + sid + '\'});if(sup){sup.city=this.value;var g=geocodeCity(this.value);if(g){sup.lat=g.lat;sup.lng=g.lng;}}"></td>' +
      '<td style="padding:12px 16px;text-align:right;"><input type="number" value="' + s.volume + '" min="1" step="10" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="var sup=netoptState.suppliers.find(function(x){return x.id===\'' + sid + '\'});if(sup)sup.volume=parseFloat(this.value);"></td>' +
      '<td style="padding:12px 16px;text-align:center;">' +
        '<select class="wsc-select" style="width:100%;font-size:12px;" onchange="var sup=netoptState.suppliers.find(function(x){return x.id===\'' + sid + '\'});if(sup)sup.mode=this.value;">' +
        '<option' + (s.mode === 'TL' ? ' selected' : '') + '>TL</option>' +
        '<option' + (s.mode === 'LTL' ? ' selected' : '') + '>LTL</option>' +
        '</select></td>' +
      '<td style="padding:12px 16px;text-align:center;"><button onclick="netoptRemoveSupplier(\'' + sid + '\')" style="padding:4px 8px;background:#fff;border:1px solid var(--ies-red);color:var(--ies-red);border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Remove</button></td>';
    tbody.appendChild(row);
  });
}

function netoptGeocodeSupplier(id) {
  var s = netoptState.suppliers.find(function(x) { return x.id === id; });
  if (s) {
    var g = geocodeCity(s.city);
    if (g) { s.lat = g.lat; s.lng = g.lng; }
  }
}

// ── MARKET PICKER (select from 10 pre-defined markets) ──
function netoptShowMarketPicker() {
  var picker = document.getElementById('netopt-market-picker');
  var grid = document.getElementById('netopt-market-grid');
  // Determine which markets are already added
  var existingCities = netoptState.facilities.map(function(f) { return f.city.toLowerCase().trim(); });
  grid.innerHTML = '';
  NETOPT_FACILITY_CANDIDATES.forEach(function(m, idx) {
    var alreadyAdded = existingCities.indexOf(m.city.toLowerCase().trim()) !== -1;
    var card = document.createElement('label');
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ' + (alreadyAdded ? 'var(--ies-gray-200,#e5e7eb)' : 'var(--ies-gray-300,#d1d5db)') + ';border-radius:8px;cursor:' + (alreadyAdded ? 'default' : 'pointer') + ';background:' + (alreadyAdded ? '#f3f4f6' : '#fff') + ';transition:border-color .15s,box-shadow .15s;opacity:' + (alreadyAdded ? '0.55' : '1') + ';';
    if (!alreadyAdded) {
      card.onmouseenter = function() { this.style.borderColor = 'var(--ies-blue)'; this.style.boxShadow = '0 0 0 2px rgba(0,71,171,.1)'; };
      card.onmouseleave = function() { var cb = this.querySelector('input'); this.style.borderColor = cb && cb.checked ? 'var(--ies-blue)' : 'var(--ies-gray-300,#d1d5db)'; this.style.boxShadow = 'none'; };
    }
    var checkbox = '<input type="checkbox" data-market-idx="' + idx + '" ' + (alreadyAdded ? 'disabled checked' : '') + ' style="width:16px;height:16px;accent-color:var(--ies-blue);cursor:' + (alreadyAdded ? 'default' : 'pointer') + ';">';
    var info = '<div style="flex:1;min-width:0;">' +
      '<div style="font-weight:700;font-size:12px;color:var(--ies-navy);">' + m.name + '</div>' +
      '<div style="font-size:10px;color:#6b7280;">' + m.city + ' &middot; ' + m.capacity + 'K cap &middot; ' + fmtNum(m.fixedCost, 1, '$') + 'M fixed</div>' +
      (alreadyAdded ? '<div style="font-size:9px;color:var(--ies-blue);font-weight:600;margin-top:2px;">Already added</div>' : '') +
      '</div>';
    card.innerHTML = checkbox + info;
    grid.appendChild(card);
  });
  picker.style.display = 'block';
}

function netoptCloseMarketPicker() {
  document.getElementById('netopt-market-picker').style.display = 'none';
}

function netoptMarketPickerSelectAll() {
  var cbs = document.querySelectorAll('#netopt-market-grid input[type="checkbox"]:not(:disabled)');
  cbs.forEach(function(cb) { cb.checked = true; cb.closest('label').style.borderColor = 'var(--ies-blue)'; });
}

function netoptMarketPickerClear() {
  var cbs = document.querySelectorAll('#netopt-market-grid input[type="checkbox"]:not(:disabled)');
  cbs.forEach(function(cb) { cb.checked = false; cb.closest('label').style.borderColor = 'var(--ies-gray-300,#d1d5db)'; });
}

function netoptAddSelectedMarkets() {
  var cbs = document.querySelectorAll('#netopt-market-grid input[type="checkbox"]:checked:not(:disabled)');
  var count = 0;
  cbs.forEach(function(cb) {
    var idx = parseInt(cb.getAttribute('data-market-idx'), 10);
    var m = NETOPT_FACILITY_CANDIDATES[idx];
    if (!m) return;
    var id = 'fac-' + Date.now() + '-' + idx;
    var g = geocodeCity(m.city);
    netoptState.facilities.push({
      id: id,
      name: m.name,
      city: m.city,
      capacity: m.capacity,
      fixedCost: m.fixedCost,
      varCost: m.varCost,
      status: 'Candidate',
      lat: g ? g.lat : null,
      lng: g ? g.lng : null
    });
    count++;
  });
  netoptCloseMarketPicker();
  netoptRenderFacilitiesTable();
  netoptUpdateKPI();
  if (count > 0) {
    netoptShowToast(count + ' market' + (count > 1 ? 's' : '') + ' added as facility candidates');
  }
}

// ── AUTO-RECOMMEND FACILITIES FROM DEMAND ──
function netoptAutoRecommendFacilities() {
  if (netoptState.demands.length === 0) {
    alert('Please add demand points first. The system needs demand data to recommend facility locations.');
    return;
  }

  // Build weighted demand points for clustering
  var demandPts = [];
  netoptState.demands.forEach(function(d) {
    var lat = d.lat, lng = d.lng;
    if (!lat || !lng) {
      var g = geocodeCity(d.city + (d.state ? ', ' + d.state : ''));
      if (g) { lat = g.lat; lng = g.lng; d.lat = lat; d.lng = lng; }
    }
    if (lat && lng) {
      demandPts.push({ lat: lat, lng: lng, weight: d.volume || 100 });
    }
  });

  if (demandPts.length === 0) {
    alert('Could not geocode any demand points. Please check city names.');
    return;
  }

  // Determine cluster count: min 2, max 6, scale with demand points
  var k = Math.min(Math.max(2, Math.ceil(demandPts.length / 15)), 6);
  // Respect constraints if set
  if (netoptState.constraints.maxFacilities) {
    k = Math.min(k, netoptState.constraints.maxFacilities);
  }

  // Run k-means clustering (reuse existing kMeansCOG)
  var clusters = kMeansCOG(demandPts, k, 50);

  // Map each cluster center to the nearest real city, then find closest NETOPT market
  var recommended = [];
  var usedNames = {};
  clusters.forEach(function(cl) {
    // Find nearest city in NET_CITIES
    var nc = nearestCity(cl.center.lat, cl.center.lng);
    // Try to match to a NETOPT_FACILITY_CANDIDATES entry
    var matched = null;
    var bestDist = Infinity;
    NETOPT_FACILITY_CANDIDATES.forEach(function(cand) {
      var candGeo = geocodeCity(cand.city);
      if (candGeo) {
        var d = haversine(cl.center.lat, cl.center.lng, candGeo.lat, candGeo.lng);
        if (d < bestDist) { bestDist = d; matched = cand; }
      }
    });

    // Use matched market if within 300 miles, otherwise use nearest city with estimated costs
    var facName, facCity, facCapacity, facFixed, facVar;
    if (matched && bestDist < 300) {
      facName = matched.name;
      facCity = matched.city;
      facCapacity = matched.capacity;
      facFixed = matched.fixedCost;
      facVar = matched.varCost;
    } else {
      facName = nc.replace(/,.*/, '').trim();
      facCity = nc;
      facCapacity = Math.round(cl.totalWeight * 1.2);
      facFixed = 2.5;
      facVar = 0.23;
    }

    // Avoid duplicates
    if (usedNames[facName]) {
      facName = facName + ' (' + (Object.keys(usedNames).length + 1) + ')';
    }
    usedNames[facName] = true;

    var geo = geocodeCity(facCity);
    recommended.push({
      name: facName,
      city: facCity,
      capacity: facCapacity,
      fixedCost: facFixed,
      varCost: facVar,
      lat: geo ? geo.lat : cl.center.lat,
      lng: geo ? geo.lng : cl.center.lng,
      clusterWeight: cl.totalWeight,
      clusterSize: cl.members.length
    });
  });

  // Check for existing facilities and warn
  var existingCities = netoptState.facilities.map(function(f) { return f.city.toLowerCase().trim(); });
  var newRecs = recommended.filter(function(r) { return existingCities.indexOf(r.city.toLowerCase().trim()) === -1; });
  var skipped = recommended.length - newRecs.length;

  if (newRecs.length === 0) {
    alert('All recommended locations are already in your facility list.');
    return;
  }

  // Add recommended facilities
  newRecs.forEach(function(r) {
    netoptState.facilities.push({
      id: 'fac-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: r.name,
      city: r.city,
      capacity: r.capacity,
      fixedCost: r.fixedCost,
      varCost: r.varCost,
      status: 'Candidate',
      lat: r.lat,
      lng: r.lng
    });
  });

  netoptRenderFacilitiesTable();
  netoptUpdateKPI();

  var msg = newRecs.length + ' facility location' + (newRecs.length > 1 ? 's' : '') + ' recommended based on demand clustering';
  if (skipped > 0) msg += ' (' + skipped + ' already existed)';
  netoptShowToast(msg);
}

// Small toast helper for NetOpt
function netoptShowToast(message) {
  var toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ies-navy,#1c1c2e);color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .3s;';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 300); }, 3000);
}

// Geocode facility
function netoptGeocodeFacility(id) {
  var f = netoptState.facilities.find(x => x.id === id);
  if (f) {
    var g = geocodeCity(f.city);
    if (g) { f.lat = g.lat; f.lng = g.lng; }
  }
}

// Geocode demand
function netoptGeocideDemand(id) {
  var d = netoptState.demands.find(x => x.id === id);
  if (d) {
    var g = geocodeCity(d.city);
    if (g) { d.lat = g.lat; d.lng = g.lng; }
  }
}

// Update KPI strip
function netoptUpdateKPI() {
  var transport = netoptState.transport;
  transport.outboundPerUnitMile = parseFloat(document.getElementById('netopt-outbound-cost').value) || 0.0025;
  transport.inboundPerUnitMile = parseFloat(document.getElementById('netopt-inbound-cost').value) || 0.0015;
  transport.truckSpeedMiPerDay = parseFloat(document.getElementById('netopt-truck-speed').value) || 500;

  var constraints = netoptState.constraints;
  constraints.serviceLevelPct = parseFloat(document.getElementById('netopt-service-target').value) || 95;
  constraints.minFacilities = parseFloat(document.getElementById('netopt-min-facilities').value) || 1;
  constraints.maxFacilities = parseFloat(document.getElementById('netopt-max-facilities').value) || 5;
  constraints.budgetCap = document.getElementById('netopt-budget-cap').value ? parseFloat(document.getElementById('netopt-budget-cap').value) : null;
  constraints.inventoryCarryPct = parseFloat(document.getElementById('netopt-inventory-carry').value) || 15;

  // Calculate summary KPIs
  var totalDemand = netoptState.demands.reduce((s, d) => s + (d.volume || 0), 0) * 1000; // Convert K to units
  var openCount = netoptState.results ? (netoptState.results.openFacilities || []).length : 0;
  var totalCost = netoptState.results ? netoptState.results.totalCost : 0;
  var avgDist = netoptState.results ? netoptState.results.avgDistance : 0;
  var servicePct = netoptState.results ? netoptState.results.serviceLevel : 0;

  document.getElementById('netopt-k-open').textContent = openCount || '—';
  document.getElementById('netopt-k-demand').textContent = totalDemand ? (totalDemand >= 1000000 ? fmtNum(totalDemand / 1000000, 1) + 'M' : fmtNum(totalDemand / 1000, 0) + 'K') : '—';
  document.getElementById('netopt-k-cost').textContent = totalCost ? fmtNum(totalCost, 1, '$') + 'M' : '—';
  document.getElementById('netopt-k-service').textContent = servicePct != null ? fmtNum(servicePct, 0) + '%' : '—';
  document.getElementById('netopt-k-dist').textContent = avgDist ? Math.round(avgDist).toLocaleString('en-US') : '—';
}

// Set solver mode
function netoptSetSolverMode(mode) {
  netoptState.solverMode = mode;
  var hBtn = document.getElementById('netopt-mode-heuristic');
  var eBtn = document.getElementById('netopt-mode-exact');
  var desc = document.getElementById('netopt-solver-desc');

  if (mode === 'heuristic') {
    hBtn.style.background = 'var(--ies-blue)';
    hBtn.style.color = '#fff';
    eBtn.style.background = '#fff';
    eBtn.style.color = 'var(--ies-navy)';
    desc.textContent = 'Greedy addition — 80-90% optimal, <100ms';
  } else {
    eBtn.style.background = 'var(--ies-blue)';
    eBtn.style.color = '#fff';
    hBtn.style.background = '#fff';
    hBtn.style.color = 'var(--ies-navy)';
    desc.textContent = 'Exhaustive enumeration — provably optimal, <3s';
  }
}

// Run optimization
function netoptRunOptimization() {
  if (netoptState.facilities.length === 0 && netoptState.demands.length === 0) {
    alert('Please add at least one facility candidate and one demand point before running optimization.');
    return;
  }
  if (netoptState.facilities.length === 0) {
    alert('Please add at least one facility candidate. Use "Select from Markets" to choose from pre-defined locations, "Auto-Recommend" to suggest locations based on your demand, or "+ Add Facility" to add manually.');
    return;
  }
  if (netoptState.demands.length === 0) {
    alert('Please add at least one demand point before running optimization.');
    return;
  }

  // Geocode any missing coordinates
  netoptState.facilities.forEach(f => {
    if (!f.lat || !f.lng) {
      var g = geocodeCity(f.city);
      if (g) { f.lat = g.lat; f.lng = g.lng; }
    }
  });
  netoptState.demands.forEach(d => {
    if (!d.lat || !d.lng) {
      var g = geocodeCity(d.city);
      if (g) { d.lat = g.lat; d.lng = g.lng; }
    }
  });

  // Run selected solver
  var startTime = performance.now();
  var results;
  if (netoptState.solverMode === 'exact') {
    results = netoptExactOptimize(
      netoptState.facilities,
      netoptState.demands,
      netoptState.transport,
      netoptState.constraints
    );
  } else {
    results = netoptGreedyOptimize(
      netoptState.facilities,
      netoptState.demands,
      netoptState.transport,
      netoptState.constraints
    );
  }
  var elapsed = performance.now() - startTime;
  results.solverMode = netoptState.solverMode;
  results.solveTimeMs = elapsed;

  // Show solve time
  var timeEl = document.getElementById('netopt-solve-time');
  if (timeEl) {
    timeEl.style.display = 'inline';
    timeEl.textContent = 'Solved in ' + fmtNum(elapsed, 0) + 'ms (' + (netoptState.solverMode === 'exact' ? 'exact' : 'heuristic') + ')';
  }

  netoptState.results = results;
  netoptRenderResults();
  netoptUpdateKPI();

  // Switch to results tab
  document.getElementById('netopt-results-empty').style.display = 'none';
  document.getElementById('netopt-results-content').style.display = 'block';
  netoptSwitchTab('results');
}

// Greedy Facility Addition Heuristic
function netoptGreedyOptimize(facilities, demands, transport, constraints) {
  var scenarios = [];
  var minFacs = constraints.minFacilities || 1;
  var maxFacs = Math.min(constraints.maxFacilities || 5, facilities.length);

  // Evaluate each facility count from 1 to maxFacs
  for (var numFacs = 1; numFacs <= maxFacs; numFacs++) {
    // Find best numFacs facilities
    var bestConfig = netoptFindBestConfig(facilities, demands, transport, constraints, numFacs);
    scenarios.push(bestConfig);
  }

  // Tag best-cost and best-service scenarios
  var bestCostIdx = 0, bestServiceIdx = 0;
  for (var si = 0; si < scenarios.length; si++) {
    if (scenarios[si].totalCost < scenarios[bestCostIdx].totalCost) bestCostIdx = si;
    if (scenarios[si].avgDeliveryDays < scenarios[bestServiceIdx].avgDeliveryDays) bestServiceIdx = si;
  }
  scenarios.forEach(function(s, i) {
    s._isBestCost = (i === bestCostIdx);
    s._isBestService = (i === bestServiceIdx);
    // Hard constraint enforcement: mark scenarios below target service as infeasible
    var targetPct = constraints.targetServicePct || constraints.serviceLevelPct || 95;
    if (constraints.hardConstraint && s.serviceLevel < targetPct) {
      s._hardConstraintFail = true;
      s._hardConstraintReason = 'Service ' + fmtNum(s.serviceLevel, 1) + '% < ' + targetPct + '% target';
    }
  });

  // Default recommended = best cost among feasible (backward compatible)
  var bestScenario = scenarios.reduce((best, curr) => {
    if (constraints.budgetCap && curr.totalCost > constraints.budgetCap) return best;
    if (curr.serviceLevel < constraints.serviceLevelPct) return best;
    return curr.totalCost < best.totalCost ? curr : best;
  }, scenarios[0] || {});

  bestScenario.allScenarios = scenarios;
  bestScenario.bestCostIdx = bestCostIdx;
  bestScenario.bestServiceIdx = bestServiceIdx;
  return bestScenario;
}

// Find best facility configuration for a given count
function netoptFindBestConfig(facilities, demands, transport, constraints, numFacs) {
  var best = null;
  var lockedFacs = facilities.filter(f => f.status === 'Locked Open');
  var candidateFacs = facilities.filter(f => f.status === 'Candidate');

  // Greedy: add highest-impact candidates
  var config = lockedFacs.slice();
  var remaining = candidateFacs.slice();

  while (config.length < numFacs && remaining.length > 0) {
    var bestAdd = null;
    var bestCost = Infinity;
    var bestIdx = -1;

    for (var i = 0; i < remaining.length; i++) {
      var testConfig = config.concat([remaining[i]]);
      var cost = netoptCalculateTotalCost(testConfig, demands, transport, constraints);
      if (cost < bestCost) {
        bestCost = cost;
        bestAdd = remaining[i];
        bestIdx = i;
      }
    }

    if (bestAdd) {
      config.push(bestAdd);
      remaining.splice(bestIdx, 1);
    } else {
      break;
    }
  }

  return netoptEvaluateConfig(config, demands, transport, constraints);
}

// Calculate total cost for a configuration
function netoptCalculateTotalCost(config, demands, transport, constraints) {
  var fixedCost = config.reduce((s, f) => s + (f.fixedCost || 0), 0) * 1000000; // Convert M$ to $
  var transportCost = 0;
  var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };

  demands.forEach(d => {
    if (config.length > 0) {
      var closest = config[0];
      var minDist = roadDist(d.lat, d.lng, closest.lat, closest.lng);
      for (var i = 1; i < config.length; i++) {
        var dist = roadDist(d.lat, d.lng, config[i].lat, config[i].lng);
        if (dist < minDist) {
          minDist = dist;
          closest = config[i];
        }
      }
      var vol = (d.volume || 0) * 1000; // K to units
      // Multi-mode cost: TL and LTL are distance-based, parcel is zone-based
      var tlCost = vol * mix.tl * minDist * (transport.tlUnitMile || transport.outboundPerUnitMile || 0.0025);
      var ltlCost = vol * mix.ltl * minDist * (transport.ltlUnitMile || transport.outboundPerUnitMile || 0.0040);
      var parcelCost = vol * mix.parcel * (transport.parcelUnitCost || 8.50); // flat per unit for parcel
      transportCost += tlCost + ltlCost + parcelCost;
    }
  });

  return (fixedCost + transportCost) / 1000000; // Return in M$
}

// Reusable transit day estimation helper
function estimateTransitDays(distMiles, transport) {
  var speed = (transport && transport.truckSpeedMiPerDay) || 500;
  var mix = (transport && transport.modeMix) || { tl: 0.7, ltl: 0.2, parcel: 0.1 };
  var groundDays = distMiles <= 150 ? 1 : Math.ceil(distMiles / speed) + 1;
  var parcelDays = distMiles <= 50 ? 1 : distMiles <= 150 ? 2 : distMiles <= 400 ? 3 : distMiles <= 800 ? 4 : 5;
  var groundPct = (mix.tl || 0) + (mix.ltl || 0);
  var parcelPct = mix.parcel || 0;
  var total = groundPct + parcelPct;
  if (total === 0) return groundDays;
  return Math.max(1, Math.round(((groundDays * groundPct + parcelDays * parcelPct) / total) * 10) / 10);
}

// Evaluate a configuration
function netoptEvaluateConfig(config, demands, transport, constraints) {
  var fixedCost = config.reduce((s, f) => s + (f.fixedCost || 0), 0);
  var transportCost = 0;
  var assignedVolume = {};
  var distances = [];
  var serviceCt = 0;
  var slaMet = 0;
  var slaTotal = 0;
  var truckSpeed = transport.truckSpeedMiPerDay || 500;

  // Delivery day buckets: volume-weighted (units in K)
  var dayBuckets = { d1: 0, d2: 0, d3: 0, d4: 0, d5plus: 0 };
  var totalVolume = 0;
  var weightedDaySum = 0;

  // B1: Track demand-to-facility assignments for flow visualization and allocation table
  var demandAssignments = [];

  config.forEach(f => assignedVolume[f.id] = 0);

  // B1: First pass — assign demands to nearest facility, track assignments
  var pendingAssignments = [];
  demands.forEach(function(d) {
    if (config.length === 0) return;
    // Sort facilities by distance, penalizing those that violate transit SLA
    var maxD = d.maxDays || (constraints && constraints.globalMaxDays) || 999;
    var sorted = config.map(function(f) {
      var dist = roadDist(d.lat, d.lng, f.lat, f.lng);
      var days = estimateTransitDays(dist, transport);
      return { facility: f, dist: dist, transitDays: days };
    }).sort(function(a, b) {
      var penA = a.transitDays > maxD ? 1e6 : 0;
      var penB = b.transitDays > maxD ? 1e6 : 0;
      return (a.dist + penA) - (b.dist + penB);
    });
    pendingAssignments.push({ demand: d, sortedFacs: sorted });
  });

  // B1: Capacity-aware assignment with overflow
  // Pass 1: assign to nearest; Pass 2: overflow excess to next-nearest
  var capacityK = {};
  config.forEach(function(f) { capacityK[f.id] = f.capacity || Infinity; });

  pendingAssignments.forEach(function(pa) {
    var d = pa.demand;
    var vol = d.volume || 0;
    var remaining = vol;

    for (var fi = 0; fi < pa.sortedFacs.length && remaining > 0; fi++) {
      var sf = pa.sortedFacs[fi];
      var fac = sf.facility;
      var dist = sf.dist;
      var available = capacityK[fac.id] - (assignedVolume[fac.id] || 0);

      if (available <= 0) continue;

      var allocated = Math.min(remaining, available);
      assignedVolume[fac.id] = (assignedVolume[fac.id] || 0) + allocated;
      remaining -= allocated;

      // Transport cost for this allocation
      var volUnits = allocated * 1000;
      var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
      var tlCost = volUnits * mix.tl * dist * (transport.tlUnitMile || transport.outboundPerUnitMile || 0.0025);
      var ltlCost = volUnits * mix.ltl * dist * (transport.ltlUnitMile || transport.outboundPerUnitMile || 0.0040);
      var parcelCost = volUnits * mix.parcel * (transport.parcelUnitCost || 8.50);
      transportCost += tlCost + ltlCost + parcelCost;
      distances.push(dist);

      // Service level: check both distance AND transit day SLA
      var transitDays = estimateTransitDays(dist, transport);
      var demandMaxDays = d.maxDays || (constraints && constraints.globalMaxDays) || 999;
      var meetsDistance = dist <= (d.maxMiles || 9999);
      var meetsDays = transitDays <= demandMaxDays;
      if (meetsDistance && meetsDays) serviceCt += (allocated / vol);

      totalVolume += allocated;
      weightedDaySum += transitDays * allocated;

      if (transitDays <= 1.5) dayBuckets.d1 += allocated;
      else if (transitDays <= 2.5) dayBuckets.d2 += allocated;
      else if (transitDays <= 3.5) dayBuckets.d3 += allocated;
      else if (transitDays <= 4.5) dayBuckets.d4 += allocated;
      else dayBuckets.d5plus += allocated;

      // Track assignment for flow visualization
      demandAssignments.push({
        demandId: d.id, demandCity: d.city, demandLat: d.lat, demandLng: d.lng,
        facilityId: fac.id, facilityName: fac.name, facilityLat: fac.lat, facilityLng: fac.lng,
        volume: allocated, distance: dist, transitDays: transitDays,
        transportCost: (tlCost + ltlCost + parcelCost) / 1000000
      });
    }

    // If still remaining after all facilities full, assign to nearest anyway (infeasible overflow)
    if (remaining > 0 && pa.sortedFacs.length > 0) {
      var nearest = pa.sortedFacs[0];
      assignedVolume[nearest.facility.id] = (assignedVolume[nearest.facility.id] || 0) + remaining;
      var volUnits = remaining * 1000;
      var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
      transportCost += volUnits * mix.tl * nearest.dist * (transport.tlUnitMile || transport.outboundPerUnitMile || 0.0025);
      transportCost += volUnits * mix.ltl * nearest.dist * (transport.ltlUnitMile || transport.outboundPerUnitMile || 0.0040);
      transportCost += volUnits * mix.parcel * (transport.parcelUnitCost || 8.50);
      distances.push(nearest.dist);
      totalVolume += remaining;

      demandAssignments.push({
        demandId: d.id, demandCity: d.city, demandLat: d.lat, demandLng: d.lng,
        facilityId: nearest.facility.id, facilityName: nearest.facility.name,
        facilityLat: nearest.facility.lat, facilityLng: nearest.facility.lng,
        volume: remaining, distance: nearest.dist, transitDays: 0, transportCost: 0
      });
    }

    // Track SLA compliance per demand point
    slaTotal++;
    var demandMaxD = d.maxDays || (constraints && constraints.globalMaxDays) || 999;
    // Check if primary assignment meets SLA (use first assignment for this demand)
    var primaryAssign = demandAssignments.filter(function(a) { return a.demandId === d.id; })[0];
    if (primaryAssign && primaryAssign.transitDays <= demandMaxD && primaryAssign.distance <= (d.maxMiles || 9999)) {
      slaMet++;
    }
  });

  var varCost = config.reduce((s, f) => {
    var vol = assignedVolume[f.id] || 0;
    return s + (vol * 1000 * (f.varCost || 0) / 1000000);
  }, 0);

  // B5: Inbound transport cost from suppliers to facilities
  var inboundCost = 0;
  var suppliers = netoptState.suppliers || [];
  if (suppliers.length > 0 && config.length > 0) {
    var inboundRate = transport.inboundPerUnitMile || 0.00178;
    suppliers.forEach(function(sup) {
      if (!sup.lat || !sup.lng) return;
      var supVol = (sup.volume || 0) * 1000; // K to units
      // Distribute supplier volume proportionally across facilities by their assigned demand
      var totalAssigned = config.reduce(function(s, f) { return s + (assignedVolume[f.id] || 0); }, 0) || 1;
      config.forEach(function(f) {
        var facShare = (assignedVolume[f.id] || 0) / totalAssigned;
        var dist = roadDist(sup.lat, sup.lng, f.lat, f.lng);
        var supMix = sup.mode === 'LTL' ? { tl: 0, ltl: 1 } : { tl: 1, ltl: 0 };
        var tlRate = transport.tlUnitMile || inboundRate;
        var ltlRate = transport.ltlUnitMile || inboundRate * 1.6;
        inboundCost += supVol * facShare * dist * (supMix.tl * tlRate + supMix.ltl * ltlRate);
      });
    });
  }

  var inventoryCost = (fixedCost + varCost) * (constraints.inventoryCarryPct || 15) / 100 / 12; // Monthly carry
  var totalCost = fixedCost + (transportCost / 1000000) + (inboundCost / 1000000) + varCost + inventoryCost;
  var avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b) / distances.length : 0;
  var serviceLevel = demands.length > 0 ? (serviceCt / demands.length) * 100 : 0;
  var avgDeliveryDays = totalVolume > 0 ? weightedDaySum / totalVolume : 0;

  // Convert day buckets to percentages
  var dayPct = {
    d1: totalVolume > 0 ? (dayBuckets.d1 / totalVolume * 100) : 0,
    d2: totalVolume > 0 ? (dayBuckets.d2 / totalVolume * 100) : 0,
    d3: totalVolume > 0 ? (dayBuckets.d3 / totalVolume * 100) : 0,
    d4: totalVolume > 0 ? (dayBuckets.d4 / totalVolume * 100) : 0,
    d5plus: totalVolume > 0 ? (dayBuckets.d5plus / totalVolume * 100) : 0
  };

  // B1: Compute utilization and feasibility per facility
  var utilization = {};
  var feasibility = 'green'; // green = all OK, yellow = some 80-100%, red = over capacity
  config.forEach(function(f) {
    var vol = assignedVolume[f.id] || 0;
    var cap = f.capacity || Infinity;
    var pct = cap !== Infinity ? (vol / cap * 100) : 0;
    utilization[f.id] = { volume: vol, capacity: cap, pct: pct };
    if (pct > 100 && feasibility !== 'red') feasibility = 'red';
    else if (pct >= 80 && feasibility === 'green') feasibility = 'yellow';
  });

  return {
    openFacilities: config,
    assignedVolume: assignedVolume,
    demandAssignments: demandAssignments,
    utilization: utilization,
    feasibility: feasibility,
    fixedCostM: fixedCost,
    transportCostM: transportCost / 1000000,
    inboundCostM: inboundCost / 1000000,
    varCostM: varCost,
    inventoryCostM: inventoryCost,
    totalCost: totalCost,
    avgDistance: avgDistance,
    serviceLevel: serviceLevel,
    avgDeliveryDays: avgDeliveryDays,
    dayPct: dayPct,
    slaMet: slaMet,
    slaTotal: slaTotal
  };
}

// Exact solver: enumerate all facility combinations to find provably optimal
function netoptExactOptimize(facilities, demands, transport, constraints) {
  var candidateCount = facilities.filter(f => f.status === 'Candidate').length;
  if (candidateCount > 20) {
    var proceed = confirm('Exact solver with ' + candidateCount + ' candidate facilities may take a long time or hang the browser.\n\nRecommend using Heuristic mode for 15+ candidates.\n\nContinue anyway?');
    if (!proceed) return [];
  }
  var minFacs = constraints.minFacilities || 1;
  var maxFacs = Math.min(constraints.maxFacilities || 5, facilities.length);
  var lockedFacs = facilities.filter(f => f.status === 'Locked Open');
  var candidateFacs = facilities.filter(f => f.status === 'Candidate');

  var allScenarios = [];
  var globalBest = null;

  for (var numFacs = minFacs; numFacs <= maxFacs; numFacs++) {
    // Number of candidates we need to add beyond locked facilities
    var needed = numFacs - lockedFacs.length;
    if (needed < 0) needed = 0;
    if (needed > candidateFacs.length) continue;

    // Generate all C(n, k) combinations of candidates
    var combos = getCombinations(candidateFacs, needed);
    var bestForThisCount = null;

    combos.forEach(combo => {
      var config = lockedFacs.concat(combo);
      var result = netoptEvaluateConfig(config, demands, transport, constraints);

      if (!bestForThisCount || result.totalCost < bestForThisCount.totalCost) {
        bestForThisCount = result;
      }
    });

    if (bestForThisCount) {
      allScenarios.push(bestForThisCount);
      if (!globalBest || bestForThisCount.totalCost < globalBest.totalCost) {
        if (!constraints.budgetCap || bestForThisCount.totalCost <= constraints.budgetCap) {
          if (bestForThisCount.serviceLevel >= constraints.serviceLevelPct) {
            globalBest = bestForThisCount;
          }
        }
      }
    }
  }

  // Tag best-cost and best-service scenarios
  var bestCostIdx = 0, bestServiceIdx = 0;
  for (var si = 0; si < allScenarios.length; si++) {
    if (allScenarios[si].totalCost < allScenarios[bestCostIdx].totalCost) bestCostIdx = si;
    if (allScenarios[si].avgDeliveryDays < allScenarios[bestServiceIdx].avgDeliveryDays) bestServiceIdx = si;
  }
  allScenarios.forEach(function(s, i) {
    s._isBestCost = (i === bestCostIdx);
    s._isBestService = (i === bestServiceIdx);
  });

  if (!globalBest && allScenarios.length > 0) globalBest = allScenarios[0];
  if (globalBest) {
    globalBest.allScenarios = allScenarios;
    globalBest.bestCostIdx = bestCostIdx;
    globalBest.bestServiceIdx = bestServiceIdx;
  }
  if (!globalBest) globalBest = { openFacilities: [], totalCost: Infinity, allScenarios: allScenarios };
  return globalBest;
}

// Generate all combinations of k items from array
function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  var results = [];
  function combine(start, chosen) {
    if (chosen.length === k) { results.push(chosen.slice()); return; }
    for (var i = start; i <= arr.length - (k - chosen.length); i++) {
      chosen.push(arr[i]);
      combine(i + 1, chosen);
      chosen.pop();
    }
  }
  combine(0, []);
  return results;
}

// Render results
function netoptRenderResults() {
  var r = netoptState.results;
  if (!r) return;

  // Intelligent recommendation
  netoptRenderRecommendation(r);

  // Cost breakdown
  var tbody = document.getElementById('netopt-cost-breakdown');
  tbody.innerHTML = `
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Facility Fixed Costs</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.fixedCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Outbound Transport</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.transportCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Inbound Transport</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.inboundCostM || 0, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Variable Handling</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.varCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Inventory Carrying</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.inventoryCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-top:2px solid var(--ies-navy);">
      <td style="padding:10px 0;font-weight:700;color:var(--ies-navy);">TOTAL ANNUAL COST</td>
      <td style="padding:10px 0;text-align:right;font-weight:900;color:var(--ies-navy);font-size:14px;">${fmtNum(r.totalCost, 2, '$')}M</td>
    </tr>
  `;

  // Delivery Performance card
  var spBody = document.getElementById('netopt-service-profile-body');
  if (spBody && r.dayPct) {
    var dp = r.dayPct;
    var barColors = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
    var barLabels = ['1 Day', '2 Day', '3 Day', '4 Day', '5+ Day'];
    var barVals = [dp.d1, dp.d2, dp.d3, dp.d4, dp.d5plus];

    var avgDaysDisplay = r.avgDeliveryDays ? fmtNum(r.avgDeliveryDays, 1) : '—';
    var cumul2Day = fmtNum(dp.d1 + dp.d2, 0);
    var cumul3Day = fmtNum(dp.d1 + dp.d2 + dp.d3, 0);
    var slaHtml = (r.slaMet != null && r.slaTotal > 0) ?
      '<div style="margin-top:8px;font-size:10px;font-weight:600;color:' + (r.slaMet === r.slaTotal ? '#059669' : r.slaMet >= r.slaTotal * 0.9 ? '#d97706' : '#dc2626') + ';">' + r.slaMet + '/' + r.slaTotal + ' demand points meet SLA</div>' : '';
    var svcColor = r.serviceLevel >= (netoptState.constraints.targetServicePct || 95) ? '#059669' : r.serviceLevel >= (netoptState.constraints.targetServicePct || 95) - 5 ? '#d97706' : '#dc2626';

    spBody.innerHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:0 0 auto;text-align:center;padding:8px 20px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border-radius:10px;">
          <div style="font-size:28px;font-weight:800;color:var(--ies-navy);">${avgDaysDisplay}</div>
          <div style="font-size:10px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.5px;">Avg Days</div>
          <div style="margin-top:6px;font-size:10px;color:var(--ies-gray-500);">${cumul2Day}% within 2 days &middot; ${cumul3Day}% within 3 days</div>
          <div style="margin-top:4px;font-size:14px;font-weight:700;color:${svcColor};">${r.serviceLevel ? fmtNum(r.serviceLevel, 1) : '—'}% Service</div>
          ${slaHtml}
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:10px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">% of Orders by Delivery Day</div>
          ${barVals.map(function(val, bi) {
            return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
              '<div style="width:42px;font-size:10px;font-weight:600;color:var(--ies-gray-600);text-align:right;">' + barLabels[bi] + '</div>' +
              '<div style="flex:1;height:18px;background:#f1f3f5;border-radius:4px;overflow:hidden;position:relative;">' +
                '<div style="height:100%;width:' + Math.max(val, 0.5) + '%;background:' + barColors[bi] + ';border-radius:4px;transition:width .3s;"></div>' +
              '</div>' +
              '<div style="width:36px;font-size:11px;font-weight:700;color:var(--ies-navy);text-align:right;">' + fmtNum(val, 0) + '%</div>' +
            '</div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  // Scenario comparison — clickable rows with cost/service badges
  if (r.allScenarios) {
    var cBody = document.getElementById('netopt-comparison-tbody');
    cBody.innerHTML = '';
    var selectedIdx = netoptState.selectedScenarioIdx != null ? netoptState.selectedScenarioIdx : r.allScenarios.indexOf(r);
    if (selectedIdx < 0) selectedIdx = r.allScenarios.findIndex(s => s.openFacilities.length === r.openFacilities.length);

    // B3: Baseline is the 1-DC scenario for delta calculation
    var baseline = r.allScenarios[0];

    r.allScenarios.forEach((scenario, i) => {
      var numDCs = scenario.openFacilities.length;
      var facNames = scenario.openFacilities.map(f => f.name).join(', ');
      var isSelected = (i === selectedIdx);

      // Build verdict badges
      var badges = [];
      if (scenario._isBestCost) badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(16,185,129,.12);color:#059669;">BEST COST</span>');
      if (scenario._isBestService) badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(59,130,246,.12);color:#2563eb;">BEST SERVICE</span>');
      if (scenario._hardConstraintFail) badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(239,68,68,.12);color:#dc2626;">SLA FAIL</span>');
      if (scenario.feasibility === 'red') badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(239,68,68,.12);color:#dc2626;">INFEASIBLE</span>');
      else if (scenario.feasibility === 'yellow') badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(245,158,11,.12);color:#d97706;">AT CAPACITY</span>');
      var verdictHtml = badges.length > 0 ? badges.join(' ') : '<span style="color:var(--ies-gray-400);font-size:10px;">—</span>';

      // B3: Delta from baseline
      var deltaPct = baseline && baseline.totalCost > 0 ? ((scenario.totalCost - baseline.totalCost) / baseline.totalCost * 100) : 0;
      var deltaHtml = i === 0 ? '<span style="color:var(--ies-gray-400);">base</span>' :
        (deltaPct <= 0 ? '<span style="color:#059669;">' + fmtNum(deltaPct, 1) + '%</span>' :
         '<span style="color:#dc2626;">+' + fmtNum(deltaPct, 1) + '%</span>');

      // B1: Feasibility icon
      var feasIcon = scenario.feasibility === 'green' ? '&#x1f7e2;' : scenario.feasibility === 'yellow' ? '&#x1f7e1;' : scenario.feasibility === 'red' ? '&#x1f534;' : '&#x1f7e2;';

      var row = document.createElement('tr');
      row.style.borderBottom = '1px solid var(--ies-gray-200)';
      row.style.cursor = 'pointer';
      row.style.transition = 'all .15s';
      if (isSelected) {
        row.style.background = 'rgba(0,71,171,.08)';
        row.style.borderLeft = '3px solid var(--ies-blue)';
      }
      row.onmouseover = function() { if (!isSelected) this.style.background = 'rgba(0,71,171,.03)'; };
      row.onmouseout = function() { if (!isSelected) this.style.background = ''; };
      row.onclick = (function(idx) { return function() { netoptSelectScenario(idx); }; })(i);
      row.innerHTML =
        '<td style="padding:10px 14px;font-weight:600;">' + numDCs + '</td>' +
        '<td style="padding:10px 14px;font-size:11px;">' + esc(facNames) + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:600;">' + fmtNum(scenario.totalCost, 2, '$') + 'M</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + fmtNum(scenario.fixedCostM, 2, '$') + 'M</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + fmtNum(scenario.transportCostM, 2, '$') + 'M</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + (scenario.avgDistance ? fmtNum(scenario.avgDistance, 0) : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + (scenario.serviceLevel ? fmtNum(scenario.serviceLevel, 0) + '%' : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:600;">' + (scenario.avgDeliveryDays ? fmtNum(scenario.avgDeliveryDays, 1) : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:600;">' + deltaHtml + '</td>' +
        '<td style="padding:10px 14px;text-align:center;font-size:11px;">' + (scenario.slaMet != null ? scenario.slaMet + '/' + scenario.slaTotal : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:center;">' + feasIcon + '</td>' +
        '<td style="padding:10px 14px;text-align:center;">' + verdictHtml + '</td>';
      cBody.appendChild(row);
    });
  }

  // B1: Render capacity utilization card
  netoptRenderUtilization(r);

  // Render new enhancement features
  netoptRenderAllocationTable();
}

// B1: Render facility utilization bars and feasibility flag
function netoptRenderUtilization(r) {
  var container = document.getElementById('netopt-utilization-card');
  if (!container) {
    // Create utilization card if it doesn't exist yet — insert before allocation table
    var allocCard = document.getElementById('netopt-allocation-card');
    if (!allocCard) return;
    container = document.createElement('div');
    container.id = 'netopt-utilization-card';
    container.style.cssText = 'margin-bottom:16px;';
    allocCard.parentNode.insertBefore(container, allocCard);
  }

  if (!r || !r.utilization) { container.innerHTML = ''; return; }

  var feasIcon = r.feasibility === 'green' ? '&#x1f7e2;' : r.feasibility === 'yellow' ? '&#x1f7e1;' : '&#x1f534;';
  var feasLabel = r.feasibility === 'green' ? 'All facilities within capacity' :
                  r.feasibility === 'yellow' ? 'Some facilities nearing capacity (80-100%)' :
                  'Capacity exceeded — network infeasible';

  var html = '<div style="background:#fff;border:1px solid var(--ies-gray-200);border-radius:10px;padding:16px;border-left:3px solid ' +
    (r.feasibility === 'green' ? '#10b981' : r.feasibility === 'yellow' ? '#f59e0b' : '#ef4444') + ';">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
  html += '<div style="font-size:11px;font-weight:700;color:var(--ies-navy);text-transform:uppercase;letter-spacing:.6px;">Facility Utilization</div>';
  html += '<div style="font-size:12px;">' + feasIcon + ' <span style="font-weight:600;">' + feasLabel + '</span></div>';
  html += '</div>';

  r.openFacilities.forEach(function(f) {
    var u = r.utilization[f.id];
    if (!u) return;
    var pct = Math.min(u.pct, 120); // cap bar display at 120%
    var barColor = u.pct <= 80 ? '#10b981' : u.pct <= 100 ? '#f59e0b' : '#ef4444';
    var capLabel = u.capacity !== Infinity ? u.capacity.toLocaleString() + 'K' : 'No limit';

    html += '<div style="margin-bottom:8px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">';
    html += '<span style="font-size:11px;font-weight:600;color:var(--ies-navy);">' + esc(f.name) + '</span>';
    html += '<span style="font-size:10px;color:var(--ies-gray-500);">' + (u.volume || 0).toLocaleString() + 'K / ' + capLabel + ' (' + fmtNum(u.pct, 0) + '%)</span>';
    html += '</div>';
    html += '<div style="height:10px;background:#f1f3f5;border-radius:5px;overflow:hidden;">';
    html += '<div style="height:100%;width:' + Math.min(pct, 100) + '%;background:' + barColor + ';border-radius:5px;transition:width .3s;"></div>';
    html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

// Switch active scenario when user clicks a row in the comparison table
function netoptSelectScenario(idx) {
  var allScenarios = netoptState.results ? netoptState.results.allScenarios : null;
  if (!allScenarios || !allScenarios[idx]) return;

  var scenario = allScenarios[idx];
  netoptState.selectedScenarioIdx = idx;

  // Update the active results to reflect the selected scenario (keep allScenarios intact)
  var prevAll = netoptState.results.allScenarios;
  var prevMode = netoptState.results.solverMode;
  var prevTime = netoptState.results.solveTimeMs;
  var prevBestCost = netoptState.results.bestCostIdx;
  var prevBestService = netoptState.results.bestServiceIdx;
  netoptState.results = scenario;
  netoptState.results.allScenarios = prevAll;
  netoptState.results.solverMode = prevMode;
  netoptState.results.solveTimeMs = prevTime;
  netoptState.results.bestCostIdx = prevBestCost;
  netoptState.results.bestServiceIdx = prevBestService;

  // Re-render everything for the selected scenario
  netoptRenderResults();
  netoptUpdateKPI();
  if (netoptState.mapInitialized) netoptRenderMap();
}

// Initialize map (lazy load on first Results tab view)
function netoptInitializeMap() {
  if (netoptState.mapInitialized) return;

  var mapDiv = document.getElementById('netopt-map');
  if (!mapDiv || !mapDiv.offsetParent) return; // Not visible

  var centerLat = 39.8283, centerLng = -98.5795; // US center
  netoptState.netoptMap = L.map('netopt-map').setView([centerLat, centerLng], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(netoptState.netoptMap);

  netoptRenderMap();
  netoptState.mapInitialized = true;
}

// Render map visualization
function netoptRenderMap() {
  if (!netoptState.netoptMap || !netoptState.results) return;

  var mode = netoptState.mapMode || 'markers';
  var showMarkers = (mode === 'markers' || mode === 'both');
  var showZones = (mode === 'zones');

  // Clear old layers
  netoptState.mapMarkers.forEach(m => m.remove());
  netoptState.mapPolylines.forEach(p => p.remove());
  netoptState.zoneLayers.forEach(z => z.remove());
  netoptState.mapMarkers = [];
  netoptState.mapPolylines = [];
  netoptState.zoneLayers = [];

  var r = netoptState.results;

  // Draw service zones FIRST (behind everything)
  if (showZones) {
    netoptDrawServiceZones(r.openFacilities);
  }

  // Always draw facilities (they're the solver output — always relevant)
  r.openFacilities.forEach(f => {
    var marker = L.circleMarker([f.lat, f.lng], {
      radius: 10,
      fillColor: '#10b981',
      color: '#fff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(netoptState.netoptMap);
    marker.bindPopup('<strong>' + f.name + '</strong><br>Open Facility');
    netoptState.mapMarkers.push(marker);
  });

  if (showMarkers) {
    // B4: Enhanced flow visualization using demandAssignments
    var facColors = ['#0047ab', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    var facColorMap = {};
    r.openFacilities.forEach(function(f, fi) { facColorMap[f.id] = facColors[fi % facColors.length]; });

    // Find max volume for width scaling
    var assignments = r.demandAssignments || [];
    var maxFlowVol = 1;
    assignments.forEach(function(a) { if (a.volume > maxFlowVol) maxFlowVol = a.volume; });

    // Draw demand points
    netoptState.demands.forEach(function(d) {
      if (!d.lat || !d.lng) return;
      var marker = L.circleMarker([d.lat, d.lng], {
        radius: 5,
        fillColor: '#0047ab',
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(netoptState.netoptMap);
      marker.bindPopup('<strong>' + esc(d.city) + '</strong><br>' + d.volume + 'K units');
      netoptState.mapMarkers.push(marker);
    });

    // B4: Draw flow lines from demand-to-facility assignments
    assignments.forEach(function(a) {
      if (!a.demandLat || !a.demandLng || !a.facilityLat || !a.facilityLng) return;
      var lineColor = facColorMap[a.facilityId] || 'rgba(0,71,171,.5)';
      var lineWidth = 1 + (a.volume / maxFlowVol) * 5; // 1px to 6px
      var isLongDist = a.distance > 500;
      var dashArray = isLongDist ? '8, 5' : null;
      var costStr = a.transportCost ? '$' + (a.transportCost * 1000000).toLocaleString('en-US', {maximumFractionDigits:0}) : '—';

      var polyline = L.polyline([[a.demandLat, a.demandLng], [a.facilityLat, a.facilityLng]], {
        color: lineColor,
        weight: Math.min(lineWidth, 6),
        opacity: 0.55,
        dashArray: dashArray
      }).addTo(netoptState.netoptMap);

      polyline.bindTooltip(
        '<strong>' + esc(a.demandCity) + '</strong> → <strong>' + esc(a.facilityName) + '</strong><br>' +
        a.volume.toLocaleString() + 'K units · ' + Math.round(a.distance) + ' mi · ' + costStr,
        { sticky: true, className: 'netopt-flow-tooltip' }
      );
      netoptState.mapPolylines.push(polyline);
    });

    // B4: Flow legend
    netoptRenderFlowLegend(r.openFacilities, facColorMap);
  }

  // In zones mode, also show demand dots (small, semi-transparent) for context
  if (showZones) {
    netoptState.demands.forEach(d => {
      if (!d.lat || !d.lng) return;
      var marker = L.circleMarker([d.lat, d.lng], {
        radius: 3,
        fillColor: '#1c1c2e',
        color: 'transparent',
        weight: 0,
        fillOpacity: 0.35
      }).addTo(netoptState.netoptMap);
      marker.bindPopup('<strong>' + d.city + '</strong><br>' + d.volume + 'K units');
      netoptState.mapMarkers.push(marker);
    });
  }

  // Update heatmap layer
  netoptUpdateHeatLayer();
}

// B4: Flow legend on the map
function netoptRenderFlowLegend(facilities, colorMap) {
  // Remove existing legend if any
  if (netoptState._flowLegend) {
    netoptState.netoptMap.removeControl(netoptState._flowLegend);
    netoptState._flowLegend = null;
  }
  if (!facilities || facilities.length === 0) return;

  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function() {
    var div = L.DomUtil.create('div', 'netopt-flow-legend');
    div.style.cssText = 'background:rgba(255,255,255,.92);padding:8px 12px;border-radius:8px;font-size:10px;box-shadow:0 2px 8px rgba(0,0,0,.15);max-width:180px;';
    var html = '<div style="font-weight:700;margin-bottom:4px;color:#1c1c2e;">Facility Flows</div>';
    facilities.forEach(function(f) {
      var color = colorMap[f.id] || '#0047ab';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
        '<div style="width:16px;height:3px;background:' + color + ';border-radius:2px;"></div>' +
        '<span>' + esc(f.name) + '</span></div>';
    });
    html += '<div style="margin-top:4px;border-top:1px solid #e5e7eb;padding-top:4px;color:#6b7280;">';
    html += '<div style="display:flex;align-items:center;gap:6px;"><span style="border-bottom:2px solid #999;width:16px;display:inline-block;"></span> &lt;500mi</div>';
    html += '<div style="display:flex;align-items:center;gap:6px;"><span style="border-bottom:2px dashed #999;width:16px;display:inline-block;"></span> &gt;500mi</div>';
    html += '</div>';
    div.innerHTML = html;
    return div;
  };
  legend.addTo(netoptState.netoptMap);
  netoptState._flowLegend = legend;
}

// ── SERVICE ZONE CIRCLES ──
function netoptGetDeliveryDayThresholds() {
  // Compute max road-distance (miles) for each delivery day bucket
  // Using the same logic as the solver's transit-day calculation
  var transport = netoptState.transport || {};
  var truckSpeed = transport.truckSpeedMiPerDay || 500;
  var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
  var groundPct = (mix.tl || 0) + (mix.ltl || 0);
  var parcelPct = mix.parcel || 0;
  var totalPct = groundPct + parcelPct;
  if (totalPct === 0) { groundPct = 1; totalPct = 1; }

  // Thresholds must match the solver's transit day calculation:
  // Ground: <=150mi = 1 day, then ceil(dist/speed)+1
  // Parcel: <=50mi = 1 day, <=150mi = 2 day, <=400mi = 3 day, <=800mi = 4 day
  // Blend by mode mix

  var thresholds = []; // [{day: 1, maxMiles: X}, ...]
  for (var day = 1; day <= 5; day++) {
    // Ground: 1 day ≤ 150mi; 2 day ≤ 500mi; 3 day ≤ 1000mi; etc.
    var groundMax;
    if (day <= 1) groundMax = 150;
    else groundMax = (day - 1) * truckSpeed;
    // Parcel: zone-based brackets (matching solver)
    var parcelMax;
    if (day <= 1) parcelMax = 50;
    else if (day <= 2) parcelMax = 150;
    else if (day <= 3) parcelMax = 400;
    else if (day <= 4) parcelMax = 800;
    else parcelMax = 1200; // 5+ day outer ring

    // Weighted blend
    var blended = totalPct > 0
      ? (groundMax * groundPct + parcelMax * parcelPct) / totalPct
      : groundMax;

    if (blended > 0) {
      thresholds.push({ day: day, maxMiles: blended });
    }
  }
  return thresholds;
}

// Simplified continental US boundary for zone clipping (~45 points)
var CONUS_BOUNDARY = [
  [49.0,-124.7],[48.0,-123.0],[46.3,-124.1],[43.0,-124.4],[40.0,-124.3],[38.0,-123.0],
  [35.0,-120.5],[33.5,-118.5],[32.6,-117.1],[32.5,-114.7],[31.3,-111.1],[31.3,-108.2],
  [31.8,-106.4],[29.4,-103.2],[26.0,-97.2],[27.8,-96.8],[29.0,-95.0],[29.5,-93.5],
  [29.8,-90.0],[30.0,-88.0],[30.2,-85.5],[29.9,-84.0],[25.0,-80.5],[27.0,-80.0],
  [30.3,-81.2],[32.0,-80.8],[34.5,-77.0],[36.5,-75.5],[37.5,-75.5],[38.5,-75.0],
  [39.5,-74.0],[40.5,-74.0],[41.0,-72.0],[41.5,-70.5],[42.0,-70.0],[43.5,-70.0],
  [44.5,-67.0],[47.0,-67.8],[47.5,-69.0],[45.0,-71.5],[45.0,-74.8],[43.5,-79.0],
  [42.0,-83.0],[41.5,-84.8],[46.5,-84.5],[48.0,-88.0],[46.8,-90.8],[46.8,-92.0],
  [49.0,-95.0],[49.0,-124.7]
];

function netoptPointInConus(lat, lng) {
  var inside = false;
  for (var i = 0, j = CONUS_BOUNDARY.length - 1; i < CONUS_BOUNDARY.length; j = i++) {
    var xi = CONUS_BOUNDARY[i][1], yi = CONUS_BOUNDARY[i][0];
    var xj = CONUS_BOUNDARY[j][1], yj = CONUS_BOUNDARY[j][0];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function netoptMakeClippedZone(centerLat, centerLng, radiusMiles) {
  var pts = [];
  var R = 3959;
  var numPts = 72;
  for (var a = 0; a < 360; a += (360 / numPts)) {
    var rad = a * Math.PI / 180;
    var latR = centerLat * Math.PI / 180;
    var lngR = centerLng * Math.PI / 180;
    var d = radiusMiles / R;
    var newLat = Math.asin(Math.sin(latR) * Math.cos(d) + Math.cos(latR) * Math.sin(d) * Math.cos(rad));
    var newLng = lngR + Math.atan2(Math.sin(rad) * Math.sin(d) * Math.cos(latR), Math.cos(d) - Math.sin(latR) * Math.sin(newLat));
    var lat = newLat * 180 / Math.PI;
    var lng = newLng * 180 / Math.PI;
    if (netoptPointInConus(lat, lng)) {
      pts.push([lat, lng]);
    } else {
      // Snap to nearest CONUS boundary point
      var bestDist = Infinity, bestPt = null;
      for (var bi = 0; bi < CONUS_BOUNDARY.length; bi++) {
        var bd = (lat - CONUS_BOUNDARY[bi][0]) * (lat - CONUS_BOUNDARY[bi][0]) + (lng - CONUS_BOUNDARY[bi][1]) * (lng - CONUS_BOUNDARY[bi][1]);
        if (bd < bestDist) { bestDist = bd; bestPt = CONUS_BOUNDARY[bi]; }
      }
      if (bestPt) pts.push([bestPt[0], bestPt[1]]);
    }
  }
  return pts;
}

function netoptDrawServiceZones(openFacilities) {
  if (!netoptState.netoptMap || !openFacilities || openFacilities.length === 0) return;
  if (netoptState._zoneLegend) { netoptState._zoneLegend.remove(); netoptState._zoneLegend = null; }

  var thresholds = netoptGetDeliveryDayThresholds();

  // Distinct colors: saturated border + pastel fill for clear differentiation
  var zoneStyles = [
    { day: 5, color: '#dc2626', fill: '#fecaca', label: '5+ Day' },
    { day: 4, color: '#ea580c', fill: '#fed7aa', label: '4 Day' },
    { day: 3, color: '#ca8a04', fill: '#fef08a', label: '3 Day' },
    { day: 2, color: '#2563eb', fill: '#bfdbfe', label: '2 Day' },
    { day: 1, color: '#059669', fill: '#a7f3d0', label: '1 Day' }
  ];

  // Draw 5+ day zone as full CONUS background first
  var fivePlusStyle = zoneStyles.find(function(z) { return z.day === 5; });
  if (fivePlusStyle) {
    var conusPoly = L.polygon(CONUS_BOUNDARY, {
      fillColor: fivePlusStyle.fill,
      fillOpacity: 0.5,
      color: fivePlusStyle.color,
      weight: 2,
      opacity: 0.8
    }).addTo(netoptState.netoptMap);
    conusPoly.bindPopup(fivePlusStyle.label + ' delivery zone (remainder of CONUS)');
    netoptState.zoneLayers.push(conusPoly);
  }

  // Draw days 4 → 1 zones on top (inner zones overlay the CONUS background)
  zoneStyles.forEach(function(zs) {
    if (zs.day === 5) return; // already drawn as CONUS fill
    var th = thresholds.find(function(t) { return t.day === zs.day; });
    if (!th || th.maxMiles <= 0) return;

    openFacilities.forEach(function(f) {
      if (!f.lat || !f.lng) return;

      var pts = netoptMakeClippedZone(f.lat, f.lng, th.maxMiles);
      if (pts.length < 3) return;

      var polygon = L.polygon(pts, {
        fillColor: zs.fill,
        fillOpacity: 0.5,
        color: zs.color,
        weight: 2,
        opacity: 0.8
      }).addTo(netoptState.netoptMap);

      polygon.bindPopup('<strong>' + f.name + '</strong><br>' + zs.label + ' delivery zone<br>' + fmtNum(th.maxMiles, 0) + ' mi radius');
      netoptState.zoneLayers.push(polygon);
    });
  });

  // Add a small legend overlay in the bottom-right of the map
  var legendId = 'netopt-zone-legend';
  var existing = document.getElementById(legendId);
  if (existing) existing.remove();

  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    var div = document.createElement('div');
    div.id = legendId;
    div.style.cssText = 'background:rgba(255,255,255,.92);backdrop-filter:blur(4px);padding:8px 12px;border-radius:8px;font-size:10px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.15);line-height:1.7;';
    div.innerHTML =
      '<div style="font-weight:700;font-size:11px;margin-bottom:4px;color:var(--ies-navy);">Delivery Zones</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#a7f3d0;border:1.5px solid #059669;margin-right:6px;vertical-align:-2px;"></span>1 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#bfdbfe;border:1.5px solid #2563eb;margin-right:6px;vertical-align:-2px;"></span>2 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#fef08a;border:1.5px solid #ca8a04;margin-right:6px;vertical-align:-2px;"></span>3 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#fed7aa;border:1.5px solid #ea580c;margin-right:6px;vertical-align:-2px;"></span>4 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#fecaca;border:1.5px solid #dc2626;margin-right:6px;vertical-align:-2px;"></span>5+ Day</div>';
    return div;
  };
  legend.addTo(netoptState.netoptMap);
  // Store legend control so we can remove it when switching modes
  netoptState._zoneLegend = legend;
}

// Override netoptUpdateHeatLayer to also clean up zone legend when not in zones mode

// ── INTELLIGENT RECOMMENDATION ENGINE ──
function netoptRenderRecommendation(r) {
  var panel = document.getElementById('netopt-recommendation-panel');
  if (!panel || !r || !r.allScenarios || r.allScenarios.length === 0) return;

  var scenarios = r.allScenarios;
  var bestCostIdx = r.bestCostIdx != null ? r.bestCostIdx : 0;
  var bestServiceIdx = r.bestServiceIdx != null ? r.bestServiceIdx : scenarios.length - 1;
  var costScen = scenarios[bestCostIdx];
  var serviceScen = scenarios[bestServiceIdx];
  var sameScenario = (bestCostIdx === bestServiceIdx);
  var totalVol = netoptState.demands.reduce(function(s, d) { return s + d.volume; }, 0);
  var solverLabel = r.solverMode === 'exact' ? 'Exact solver' : 'Heuristic solver';

  // Analyze trade-off
  var costDelta = serviceScen.totalCost - costScen.totalCost;
  var costDeltaPct = costScen.totalCost > 0 ? (costDelta / costScen.totalCost * 100) : 0;
  var daysDelta = costScen.avgDeliveryDays - serviceScen.avgDeliveryDays;
  var twoDayImprove = (serviceScen.dayPct.d1 + serviceScen.dayPct.d2) - (costScen.dayPct.d1 + costScen.dayPct.d2);

  // Find balanced scenario: best cost-per-day-improvement ratio
  var balancedIdx = bestCostIdx;
  if (!sameScenario && scenarios.length > 2) {
    var bestRatio = Infinity;
    for (var si = 0; si < scenarios.length; si++) {
      if (si === bestCostIdx) continue;
      var extraCost = scenarios[si].totalCost - costScen.totalCost;
      var daysGained = costScen.avgDeliveryDays - scenarios[si].avgDeliveryDays;
      if (daysGained > 0.05) {
        var ratio = extraCost / daysGained; // $/day improved
        // Penalize if diminishing returns (less improvement per $)
        var twoDayGained = (scenarios[si].dayPct.d1 + scenarios[si].dayPct.d2) - (costScen.dayPct.d1 + costScen.dayPct.d2);
        var serviceScore = daysGained + (twoDayGained / 50); // bonus for 2-day coverage
        var adjRatio = extraCost / serviceScore;
        if (adjRatio < bestRatio) {
          bestRatio = adjRatio;
          balancedIdx = si;
        }
      }
    }
  }
  var balancedScen = scenarios[balancedIdx];
  var hasBalanced = !sameScenario && balancedIdx !== bestCostIdx && balancedIdx !== bestServiceIdx;

  // Determine what to recommend and why
  var recIdx, recRationale, recType;

  if (sameScenario) {
    // Same scenario is both cheapest and fastest — easy call
    recIdx = bestCostIdx;
    recType = 'optimal';
    recRationale = 'This configuration is both the lowest cost and fastest delivery option — it dominates all other scenarios.';
  } else if (costDeltaPct < 8 && daysDelta > 0.3) {
    // Service upgrade is cheap (<8% more cost) for meaningful improvement
    recIdx = bestServiceIdx;
    recType = 'service';
    recRationale = 'The best-service network is only ' + fmtNum(costDeltaPct, 0) + '% more expensive (' + fmtNum(costDelta, 2, '$') + 'M/yr) but improves avg delivery by ' + fmtNum(daysDelta, 1) + ' days. The marginal cost is well justified by the service improvement.';
  } else if (costDeltaPct > 30 && daysDelta < 0.5) {
    // Service upgrade is expensive for minimal improvement
    recIdx = bestCostIdx;
    recType = 'cost';
    recRationale = 'Adding facilities improves delivery by only ' + fmtNum(daysDelta, 1) + ' days but costs ' + fmtNum(costDeltaPct, 0) + '% more (' + fmtNum(costDelta, 2, '$') + 'M/yr). The cost-optimized network is recommended unless SLA requirements dictate otherwise.';
  } else if (hasBalanced) {
    // There's a meaningful middle ground
    var balCostDelta = balancedScen.totalCost - costScen.totalCost;
    var balCostPct = costScen.totalCost > 0 ? (balCostDelta / costScen.totalCost * 100) : 0;
    var balDaysGain = costScen.avgDeliveryDays - balancedScen.avgDeliveryDays;
    var bal2Day = fmtNum(balancedScen.dayPct.d1 + balancedScen.dayPct.d2, 0);
    recIdx = balancedIdx;
    recType = 'balanced';
    recRationale = 'This configuration strikes the best balance — ' + fmtNum(balCostPct, 0) + '% more than the lowest-cost option (' + fmtNum(balCostDelta, 2, '$') + 'M/yr) but ' + fmtNum(balDaysGain, 1) + ' days faster with ' + bal2Day + '% of orders within 2 days. It offers the best cost-per-day-improved ratio across all scenarios.';
  } else {
    // Default: recommend based on whether the trade-off favors cost or service
    if (costDeltaPct < 15) {
      recIdx = bestServiceIdx;
      recType = 'service';
      recRationale = 'For ' + fmtNum(costDeltaPct, 0) + '% additional cost (' + fmtNum(costDelta, 2, '$') + 'M/yr), the service-optimized network delivers ' + fmtNum(daysDelta, 1) + ' fewer avg days with ' + fmtNum(twoDayImprove, 0) + ' percentage points more orders in the 2-day window.';
    } else {
      recIdx = bestCostIdx;
      recType = 'cost';
      recRationale = 'The service upgrade costs ' + fmtNum(costDeltaPct, 0) + '% more (' + fmtNum(costDelta, 2, '$') + 'M/yr) for ' + fmtNum(daysDelta, 1) + ' days improvement. The cost-optimized network is recommended unless faster delivery is a competitive requirement.';
    }
  }

  var recScen = scenarios[recIdx];
  var recFacNames = recScen.openFacilities.map(function(f) { return esc(f.name); }).join(', ');
  var rec2Day = fmtNum(recScen.dayPct.d1 + recScen.dayPct.d2, 0);

  // Determine badge color/label based on recommendation type
  var badgeColor, badgeLabel;
  if (recType === 'optimal') { badgeColor = '#10b981'; badgeLabel = 'OPTIMAL'; }
  else if (recType === 'balanced') { badgeColor = '#8b5cf6'; badgeLabel = 'BALANCED'; }
  else if (recType === 'service') { badgeColor = '#3b82f6'; badgeLabel = 'SERVICE-DRIVEN'; }
  else { badgeColor = '#10b981'; badgeLabel = 'COST-DRIVEN'; }

  // Build the panel HTML
  var html = '';

  // Main recommendation
  html += '<div style="background:linear-gradient(135deg,#f8fafc,#f0f4ff);padding:16px 18px 14px;">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">';
  html += '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="' + badgeColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="' + badgeColor + '" stroke-width="2"/></svg>';
  html += '<span style="font-weight:700;color:' + badgeColor + ';font-size:13px;">RECOMMENDED</span>';
  html += '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:' + badgeColor + '18;color:' + badgeColor + ';letter-spacing:.5px;">' + badgeLabel + '</span>';
  html += '<span style="margin-left:auto;font-size:10px;color:var(--ies-gray-400);">' + solverLabel + '</span>';
  html += '</div>';

  // Key metrics row
  html += '<div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;">';
  var metrics = [
    { label: 'Facilities', value: recScen.openFacilities.length + ' DCs' },
    { label: 'Total Cost', value: fmtNum(recScen.totalCost, 2, '$') + 'M/yr' },
    { label: 'Avg Delivery', value: fmtNum(recScen.avgDeliveryDays, 1) + ' days' },
    { label: '≤2 Day', value: rec2Day + '%' }
  ];
  metrics.forEach(function(m) {
    html += '<div style="text-align:center;padding:6px 14px;background:rgba(255,255,255,.7);border-radius:6px;border:1px solid rgba(0,0,0,.04);">';
    html += '<div style="font-size:16px;font-weight:800;color:var(--ies-navy);">' + m.value + '</div>';
    html += '<div style="font-size:9px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.4px;">' + m.label + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div style="font-size:12px;color:var(--ies-gray-600);line-height:1.6;">';
  html += '<strong>' + recScen.openFacilities.length + '-DC network:</strong> ' + recFacNames + '. ';
  html += recRationale;
  html += '</div>';
  html += '</div>';

  // If cost and service are different, show the comparison strip
  if (!sameScenario) {
    html += '<div style="display:flex;border-top:1px solid rgba(0,0,0,.06);font-size:11px;">';

    // Cost-optimal mini card
    var cFacs = costScen.openFacilities.map(function(f) { return esc(f.name); }).join(', ');
    var c2Day = fmtNum(costScen.dayPct.d1 + costScen.dayPct.d2, 0);
    html += '<div style="flex:1;padding:10px 16px;border-right:1px solid rgba(0,0,0,.06);' + (recIdx === bestCostIdx ? 'background:rgba(16,185,129,.04);' : '') + '">';
    html += '<div style="font-weight:700;color:#059669;font-size:10px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">';
    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#10b981;margin-right:4px;vertical-align:0px;"></span>Lowest Cost</div>';
    html += '<div style="color:var(--ies-navy);font-weight:600;">' + costScen.openFacilities.length + ' DCs — ' + fmtNum(costScen.totalCost, 2, '$') + 'M/yr</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + cFacs + '</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + fmtNum(costScen.avgDeliveryDays, 1) + ' avg days &middot; ' + c2Day + '% ≤2 day</div>';
    html += '</div>';

    // Service-optimal mini card
    var sFacs = serviceScen.openFacilities.map(function(f) { return esc(f.name); }).join(', ');
    var s2Day = fmtNum(serviceScen.dayPct.d1 + serviceScen.dayPct.d2, 0);
    html += '<div style="flex:1;padding:10px 16px;' + (recIdx === bestServiceIdx ? 'background:rgba(59,130,246,.04);' : '') + '">';
    html += '<div style="font-weight:700;color:#2563eb;font-size:10px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">';
    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#3b82f6;margin-right:4px;vertical-align:0px;"></span>Best Service</div>';
    html += '<div style="color:var(--ies-navy);font-weight:600;">' + serviceScen.openFacilities.length + ' DCs — ' + fmtNum(serviceScen.totalCost, 2, '$') + 'M/yr</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + sFacs + '</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + fmtNum(serviceScen.avgDeliveryDays, 1) + ' avg days &middot; ' + s2Day + '% ≤2 day</div>';
    html += '</div>';

    html += '</div>';
  }

  panel.innerHTML = html;
}

// ── NETOPT HEATMAP ──

function netoptSetMapMode(mode) {
  netoptState.mapMode = mode;
  // Remove zone legend if leaving zones mode
  if (mode !== 'zones' && netoptState._zoneLegend) {
    netoptState._zoneLegend.remove();
    netoptState._zoneLegend = null;
  }
  // Update toggle button styles
  ['markers', 'heat', 'both', 'zones'].forEach(function(m) {
    var btn = document.getElementById('netopt-map-mode-' + m);
    if (!btn) return;
    if (m === mode) {
      btn.style.background = 'var(--ies-blue)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--ies-gray-600,#4b5563)';
    }
  });
  netoptRenderMap();
}

function netoptBuildHeatData() {
  // Build [lat, lng, intensity] array from demand points
  // Use square-root scaling so high-volume points dominate visually
  // while low-volume points still register as cool spots
  var heatData = [];
  var maxVol = 1;
  netoptState.demands.forEach(function(d) {
    if ((d.volume || 0) > maxVol) maxVol = d.volume;
  });
  var sqrtMax = Math.sqrt(maxVol);
  netoptState.demands.forEach(function(d) {
    if (!d.lat || !d.lng) return;
    var vol = d.volume || 1;
    // Square-root scaling spreads the range: a 320K point vs a 50K point
    // becomes 0.97 vs 0.38 instead of linear 1.0 vs 0.16
    var intensity = Math.sqrt(vol) / sqrtMax;
    // Floor at 0.08 so even tiny demand shows as a cool spot
    intensity = Math.max(0.08, intensity);
    heatData.push([d.lat, d.lng, intensity]);
  });
  return heatData;
}

function netoptUpdateHeatLayer() {
  if (!netoptState.netoptMap) return;
  var show = (netoptState.mapMode === 'heat' || netoptState.mapMode === 'both');

  // Remove old heat layer
  if (netoptState.heatLayer) {
    netoptState.netoptMap.removeLayer(netoptState.heatLayer);
    netoptState.heatLayer = null;
  }

  if (!show) return;

  var heatData = netoptBuildHeatData();
  if (heatData.length === 0) return;

  // Create heat layer with tuned settings for US-scale network view
  // Larger radius + moderate blur = overlapping demand in dense regions merges into hot zones
  netoptState.heatLayer = L.heatLayer(heatData, {
    radius: 45,
    blur: 30,
    maxZoom: 10,
    max: 1.0,
    minOpacity: 0.15,
    gradient: {
      0.0:  '#3b4cc0',
      0.1:  '#5977e3',
      0.2:  '#7b9ff9',
      0.3:  '#9ebeff',
      0.4:  '#c0d4f5',
      0.5:  '#f2cbb7',
      0.6:  '#f0a582',
      0.7:  '#e67a5b',
      0.8:  '#d1462f',
      0.9:  '#b40426',
      1.0:  '#8b0000'
    }
  }).addTo(netoptState.netoptMap);
}

// ── NETOPT ENHANCEMENT 1: CSV EXPORT ──
function netoptExportResults() {
  var r = netoptState.results;
  if (!r) { alert('Run optimization first'); return; }

  var csv = 'Network Optimization Results Export\n';
  csv += 'Generated,' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '\n';
  csv += 'Solver Mode,' + (r.solverMode || 'heuristic') + '\n';
  csv += 'Solve Time (ms),' + (r.solveTimeMs || '-') + '\n\n';

  // Section 1: Summary
  csv += '--- SUMMARY ---\n';
  csv += 'Metric,Value\n';
  csv += 'Total Annual Cost ($M),' + r.totalCost.toFixed(2) + '\n';
  csv += 'Facility Count,' + r.openFacilities.length + '\n';
  csv += 'Service Level (%),' + (r.serviceLevel ? r.serviceLevel.toFixed(1) : '-') + '\n';
  csv += 'Avg Delivery Days,' + (r.avgDeliveryDays ? r.avgDeliveryDays.toFixed(1) : '-') + '\n';
  csv += 'Avg Distance (mi),' + (r.avgDistance ? r.avgDistance.toFixed(0) : '-') + '\n';
  csv += 'Feasibility,' + (r.feasibility || 'green') + '\n\n';

  // Section 2: Scenario Comparison
  csv += '--- SCENARIO COMPARISON ---\n';
  csv += 'Num DCs,Total Cost ($M),Fixed ($M),Transport ($M),Avg Distance (mi),Service %,Avg Days,Delta vs 1DC %,Feasibility,Verdict\n';
  if (r.allScenarios) {
    var baseline = r.allScenarios[0];
    r.allScenarios.forEach(function(s, i) {
      var verdict = '';
      if (s._isBestCost) verdict = 'BEST COST';
      if (s._isBestService) verdict = (verdict ? verdict + '/' : '') + 'BEST SERVICE';
      var delta = baseline && baseline.totalCost > 0 ? ((s.totalCost - baseline.totalCost) / baseline.totalCost * 100).toFixed(1) : '0';
      csv += s.openFacilities.length + ',' + s.totalCost.toFixed(2) + ',' + s.fixedCostM.toFixed(2) + ',' + s.transportCostM.toFixed(2);
      csv += ',' + (s.avgDistance ? s.avgDistance.toFixed(0) : '-') + ',' + (s.serviceLevel ? s.serviceLevel.toFixed(1) : '-');
      csv += ',' + (s.avgDeliveryDays ? s.avgDeliveryDays.toFixed(1) : '-') + ',' + delta + ',' + (s.feasibility || 'green') + ',' + (verdict || '-') + '\n';
    });
  }

  // Section 3: Facility Detail with utilization
  csv += '\n--- FACILITY DETAIL ---\n';
  csv += 'Name,City,Status,Capacity (K),Fixed Cost ($M),Var Cost ($/unit),Assigned Volume (K),Utilization %\n';
  r.openFacilities.forEach(function(f) {
    var vol = r.assignedVolume && r.assignedVolume[f.id] ? r.assignedVolume[f.id] : 0;
    var util = r.utilization && r.utilization[f.id] ? r.utilization[f.id].pct : 0;
    csv += f.name + ',' + f.city + ',Open,' + (f.capacity || '-') + ',' + (f.fixedCost || 0).toFixed(2);
    csv += ',' + (f.varCost || 0).toFixed(3) + ',' + vol.toFixed(0) + ',' + util.toFixed(1) + '\n';
  });

  // Section 4: Demand Allocation (from demandAssignments)
  csv += '\n--- DEMAND ALLOCATION ---\n';
  csv += 'Demand City,Volume (K),Assigned Facility,Distance (mi),Transport Cost ($),Delivery Days\n';
  var assignments = r.demandAssignments || [];
  if (assignments.length > 0) {
    assignments.forEach(function(a) {
      csv += a.demandCity + ',' + a.volume.toFixed(0) + ',' + a.facilityName + ',' + Math.round(a.distance);
      csv += ',' + (a.transportCost ? (a.transportCost * 1000000).toFixed(0) : '0') + ',' + (a.transitDays ? a.transitDays.toFixed(1) : '-') + '\n';
    });
  }

  // Section 5: Cost Breakdown
  csv += '\n--- COST BREAKDOWN ---\n';
  csv += 'Component,Amount ($M)\n';
  csv += 'Facility Fixed Costs,' + r.fixedCostM.toFixed(2) + '\n';
  csv += 'Outbound Transport,' + r.transportCostM.toFixed(2) + '\n';
  csv += 'Inbound Transport,' + (r.inboundCostM || 0).toFixed(2) + '\n';
  csv += 'Variable Handling,' + r.varCostM.toFixed(2) + '\n';
  csv += 'Inventory Carrying,' + r.inventoryCostM.toFixed(2) + '\n';
  csv += 'TOTAL ANNUAL COST,' + r.totalCost.toFixed(2) + '\n';

  // Section 6: Service Profile
  csv += '\n--- SERVICE PROFILE ---\n';
  csv += 'Delivery Window,Volume %\n';
  if (r.dayPct) {
    csv += '1-Day,' + r.dayPct.d1.toFixed(1) + '\n';
    csv += '2-Day,' + r.dayPct.d2.toFixed(1) + '\n';
    csv += '3-Day,' + r.dayPct.d3.toFixed(1) + '\n';
    csv += '4-Day,' + r.dayPct.d4.toFixed(1) + '\n';
    csv += '5+ Day,' + r.dayPct.d5plus.toFixed(1) + '\n';
  }

  // Section 7: Sensitivity Data (if available)
  if (netoptState.sensitivityData) {
    csv += '\n--- SENSITIVITY ANALYSIS ---\n';
    csv += 'Parameter,-20%,-10%,Base,+10%,+20%\n';
    netoptState.sensitivityData.forEach(function(s) {
      csv += s.label + ',' + s.values.map(function(v) { return v.toFixed(2); }).join(',') + '\n';
    });
  }

  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'netopt_results_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

// ── NETOPT ENHANCEMENT 2: SENSITIVITY ANALYSIS ──
function netoptRunSensitivityAnalysis() {
  var r = netoptState.results;
  if (!r) { alert('Run optimization first'); return; }

  var loadingEl = document.getElementById('netopt-sensitivity-loading');
  var emptyEl = document.getElementById('netopt-sensitivity-empty');
  var containerEl = document.getElementById('netopt-sensitivity-chart-container');

  if (loadingEl) loadingEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';
  if (containerEl) containerEl.style.display = 'none';

  // Run sensitivity analysis asynchronously
  setTimeout(function() {
    var baseCost = r.totalCost;
    var results = [];

    // Test parameter variations: -20%, -10%, base, +10%, +20%
    var variations = [-0.20, -0.10, 0, 0.10, 0.20];

    // 1. Demand volume sensitivity
    var demandImpacts = [];
    variations.forEach(function(pct) {
      var testDemands = netoptState.demands.map(function(d) {
        return { ...d, volume: d.volume * (1 + pct) };
      });
      var testResult = netoptEvaluateConfig(r.openFacilities, testDemands, netoptState.transport, netoptState.constraints);
      demandImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Demand Volume', impacts: demandImpacts, base: baseCost });

    // 2. Transportation cost rate sensitivity
    var transportImpacts = [];
    variations.forEach(function(pct) {
      var testTransport = { ...netoptState.transport };
      testTransport.outboundPerUnitMile = testTransport.outboundPerUnitMile * (1 + pct);
      testTransport.inboundPerUnitMile = testTransport.inboundPerUnitMile * (1 + pct);
      var testResult = netoptEvaluateConfig(r.openFacilities, netoptState.demands, testTransport, netoptState.constraints);
      transportImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Transport Rate', impacts: transportImpacts, base: baseCost });

    // 3. Facility fixed costs sensitivity
    var facilityImpacts = [];
    variations.forEach(function(pct) {
      var testFacilities = r.openFacilities.map(function(f) {
        return { ...f, fixedCost: f.fixedCost * (1 + pct) };
      });
      var testResult = netoptEvaluateConfig(testFacilities, netoptState.demands, netoptState.transport, netoptState.constraints);
      facilityImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Facility Fixed Costs', impacts: facilityImpacts, base: baseCost });

    // 4. Variable handling costs sensitivity
    var varImpacts = [];
    variations.forEach(function(pct) {
      var testFacilities = r.openFacilities.map(function(f) {
        return { ...f, varCost: f.varCost * (1 + pct) };
      });
      var testResult = netoptEvaluateConfig(testFacilities, netoptState.demands, netoptState.transport, netoptState.constraints);
      varImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Variable Handling', impacts: varImpacts, base: baseCost });

    // Render tornado chart
    netoptRenderSensitivityChart(results);

    if (loadingEl) loadingEl.style.display = 'none';
  }, 100);
}

function netoptRenderSensitivityChart(sensitivityResults) {
  if (!window.Chart) {
    alert('Chart.js not available. Please ensure Chart.js is loaded.');
    return;
  }

  var chartEl = document.getElementById('netopt-sensitivity-chart');
  var containerEl = document.getElementById('netopt-sensitivity-chart-container');
  var emptyEl = document.getElementById('netopt-sensitivity-empty');
  if (emptyEl) emptyEl.style.display = 'none';

  if (!chartEl || !containerEl) return;
  containerEl.style.display = 'block';

  // Calculate ranges for each parameter
  var labels = [];
  var lowValues = [];
  var highValues = [];
  var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  var datasetColors = [];

  sensitivityResults.forEach(function(param, idx) {
    labels.push(param.name);
    var baseIdx = 2; // Base is at index 2 (0% variation)
    var minCost = Math.min.apply(null, param.impacts);
    var maxCost = Math.max.apply(null, param.impacts);
    var baseCost = param.impacts[baseIdx];
    lowValues.push(baseCost - minCost);
    highValues.push(maxCost - baseCost);
    datasetColors.push(colors[idx % colors.length]);
  });

  // Destroy old chart if exists
  if (chartEl.chart) {
    chartEl.chart.destroy();
  }

  // Create horizontal bar chart (tornado style)
  chartEl.chart = new Chart(chartEl, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cost Decrease',
          data: lowValues,
          backgroundColor: datasetColors.map(c => c + '80'),
          borderColor: datasetColors,
          borderWidth: 1
        },
        {
          label: 'Cost Increase',
          data: highValues,
          backgroundColor: datasetColors.map(c => c + 'cc'),
          borderColor: datasetColors,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Impact on Total Cost ($M)', font: { size: 12, weight: 'bold' } },
          ticks: { callback: function(v) { return '$' + (v/1000000).toFixed(1) + 'M'; } }
        },
        y: { stacked: true }
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
        title: { display: false }
      }
    }
  });
}

// ── NETOPT ENHANCEMENT 3: DEMAND-TO-FACILITY ALLOCATION TABLE ──
function netoptRenderAllocationTable() {
  var r = netoptState.results;
  if (!r || !r.openFacilities) {
    var tbody = document.getElementById('netopt-allocation-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--ies-gray-600);">No allocation data available</td></tr>';
    return;
  }

  var tbody = document.getElementById('netopt-allocation-tbody');
  tbody.innerHTML = '';

  var rows = [];
  netoptState.demands.forEach(function(d) {
    if (r.openFacilities.length === 0) return;

    var closest = r.openFacilities[0];
    var minDist = roadDist(d.lat, d.lng, closest.lat, closest.lng);
    for (var i = 1; i < r.openFacilities.length; i++) {
      var dist = roadDist(d.lat, d.lng, r.openFacilities[i].lat, r.openFacilities[i].lng);
      if (dist < minDist) {
        minDist = dist;
        closest = r.openFacilities[i];
      }
    }

    var vol = (d.volume || 0) * 1000;
    var mix = netoptState.transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
    var tlCost = vol * mix.tl * minDist * (netoptState.transport.tlUnitMile || netoptState.transport.outboundPerUnitMile || 0.0025);
    var ltlCost = vol * mix.ltl * minDist * (netoptState.transport.ltlUnitMile || netoptState.transport.outboundPerUnitMile || 0.0040);
    var parcelCost = vol * mix.parcel * (netoptState.transport.parcelUnitCost || 8.50);
    var transportCost = tlCost + ltlCost + parcelCost;

    var truckSpeed = netoptState.transport.truckSpeedMiPerDay || 500;
    var groundDays = minDist <= 150 ? 1 : Math.ceil(minDist / truckSpeed) + 1;
    var parcelDays = minDist <= 50 ? 1 : minDist <= 150 ? 2 : minDist <= 400 ? 3 : minDist <= 800 ? 4 : 5;
    var groundPct = (mix.tl || 0) + (mix.ltl || 0);
    var parcelPct = mix.parcel || 0;
    var transitDays = groundPct > 0 || parcelPct > 0
      ? (groundDays * groundPct + parcelDays * parcelPct) / (groundPct + parcelPct)
      : groundDays;
    transitDays = Math.max(1, Math.round(transitDays * 10) / 10);

    rows.push({
      demand: d.name,
      city: d.city,
      volume: d.volume || 0,
      facility: closest.name,
      distance: minDist,
      cost: transportCost,
      days: transitDays
    });
  });

  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ies-gray-200)';
    tr.innerHTML = '<td style="padding:10px 14px;">' + esc(row.demand) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.city) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.volume, 0) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.facility) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.distance, 0) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.cost / 1000, 0, '$') + 'K</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.days, 1) + '</td>';
    tbody.appendChild(tr);
  });

  // Store rows for sorting
  tbody.dataset.rows = JSON.stringify(rows);
}

function netoptSortAllocationTable(btn, field) {
  var tbody = document.getElementById('netopt-allocation-tbody');
  if (!tbody.dataset.rows) return;

  var rows = JSON.parse(tbody.dataset.rows);
  var isAscending = btn.dataset.sort !== 'asc-' + field;

  if (field) {
    rows.sort(function(a, b) {
      var aVal = a[field];
      var bVal = b[field];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      return isAscending ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }

  // Update button state
  document.querySelectorAll('#netopt-allocation-table th').forEach(function(th) { th.style.fontWeight = '700'; });
  btn.style.fontWeight = '800';
  btn.dataset.sort = (isAscending ? 'asc-' : 'desc-') + (field || '');

  tbody.innerHTML = '';
  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ies-gray-200)';
    tr.innerHTML = '<td style="padding:10px 14px;">' + esc(row.demand) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.city) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.volume, 0) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.facility) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.distance, 0) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.cost / 1000, 0, '$') + 'K</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.days, 1) + '</td>';
    tbody.appendChild(tr);
  });
}


// ═══════════════════════════════════════════════════════════════════
// ENTERPRISE NETWORK OPT — SCENARIO MANAGEMENT & FREIGHT RATES
// ═══════════════════════════════════════════════════════════════════
function netoptCollectInputs() {
    return {
        facilities: JSON.parse(JSON.stringify(netoptState.facilities)),
        demands: JSON.parse(JSON.stringify(netoptState.demands)),
        suppliers: JSON.parse(JSON.stringify(netoptState.suppliers || [])),
        transport: JSON.parse(JSON.stringify(netoptState.transport)),
        constraints: JSON.parse(JSON.stringify(netoptState.constraints)),
        solver_mode: netoptState.solverMode || 'heuristic'
    };
}

// Apply saved state back into netopt
function netoptApplyInputs(data) {
    if (data.facilities) { netoptState.facilities = data.facilities; netoptRenderFacilitiesTable(); }
    if (data.demands) { netoptState.demands = data.demands; netoptRenderDemandsTable(); }
    if (data.suppliers) { netoptState.suppliers = data.suppliers; netoptRenderSuppliersTable(); }
    if (data.transport) {
        Object.assign(netoptState.transport, data.transport);
        var tl = document.getElementById('netopt-tl-rate');
        if (tl && data.transport.outboundPerUnitMile) {
            var unitsPer = parseFloat(document.getElementById('netopt-units-per-tl').value) || 800;
            tl.value = (data.transport.outboundPerUnitMile * unitsPer).toFixed(2);
        }
        document.getElementById('netopt-truck-speed').value = data.transport.truckSpeedMiPerDay || 500;
        // Restore mode mix if saved
        if (data.transport.modeMix) {
          document.getElementById('netopt-mode-tl-pct').value = Math.round((data.transport.modeMix.tl || 0) * 100);
          document.getElementById('netopt-mode-ltl-pct').value = Math.round((data.transport.modeMix.ltl || 0) * 100);
          document.getElementById('netopt-mode-parcel-pct').value = Math.round((data.transport.modeMix.parcel || 0) * 100);
        }
        netoptRecalcAllCosts();
    }
    if (data.constraints) {
        Object.assign(netoptState.constraints, data.constraints);
        document.getElementById('netopt-service-target').value = data.constraints.serviceLevelPct || 95;
        document.getElementById('netopt-service-target-val').textContent = (data.constraints.serviceLevelPct || 95) + '%';
        document.getElementById('netopt-min-facilities').value = data.constraints.minFacilities || 1;
        document.getElementById('netopt-max-facilities').value = data.constraints.maxFacilities || 5;
        document.getElementById('netopt-budget-cap').value = data.constraints.budgetCap || '';
        document.getElementById('netopt-inventory-carry').value = data.constraints.inventoryCarryPct || 15;
    }
    if (data.solver_mode) {
        netoptSetSolverMode(data.solver_mode);
    }
    netoptRecalcUnitMileCost();
    netoptUpdateKPI();
}

// Save netopt scenario to Supabase
async function netoptSaveScenario(projectId, scenarioName) {
    try {
        var name = scenarioName || (document.getElementById('netopt-scenario-name').value || 'Network Optimization Scenario').trim();
        if (!name) { alert('Please enter a scenario name'); return; }

        var inputs = netoptCollectInputs();
        var payload = {
            scenario_name: name,
            is_active: true,
            facilities: inputs.facilities,
            demands: inputs.demands,
            transport: inputs.transport,
            constraints: inputs.constraints,
            solver_mode: inputs.solver_mode
        };
        if (projectId) payload.project_id = projectId;

        // Save results if available
        if (netoptState.results) {
            payload.result_total_cost = netoptState.results.totalCost;
            payload.result_avg_distance = netoptState.results.avgDistance;
            payload.result_service_level = netoptState.results.serviceLevel;
            payload.result_open_facilities = netoptState.results.openFacilities;
        }

        var resp = await cmApiPost('netopt_scenarios', payload);
        netoptActiveScenarioId = resp[0].id;

        document.getElementById('netopt-scenario-name').value = name;

        // Auto-link to deal if selected
        var dealIdStr = document.getElementById('netoptDealSelector')?.value;
        if (dealIdStr && typeof sb !== 'undefined' && sb) {
            var dealIdNum = parseInt(dealIdStr, 10);
            if (!isNaN(dealIdNum)) {
                try {
                    // Check if already linked
                    var { data: existing } = await sb.from('deal_artifacts')
                        .select('id').eq('deal_id', dealIdNum)
                        .eq('artifact_type', 'netopt_scenario')
                        .eq('artifact_id', String(netoptActiveScenarioId)).limit(1);
                    if (!existing || existing.length === 0) {
                        await sb.from('deal_artifacts').insert({
                            deal_id: dealIdNum,
                            artifact_type: 'netopt_scenario',
                            artifact_id: String(netoptActiveScenarioId),
                            artifact_name: name,
                            created_by: 'IES Hub'
                        });
                    }
                } catch(e) {
                    console.warn('Could not auto-link to deal:', e);
                }
            }
        }

        var saveBtn = document.querySelector('#netopt-scenario-bar .wsc-action-btn:nth-child(1)');
        if (saveBtn) {
            var orig = saveBtn.innerHTML;
            saveBtn.innerHTML = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="var(--ies-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Saved!';
            saveBtn.style.borderColor = 'var(--ies-green)';
            saveBtn.style.color = 'var(--ies-green)';
            setTimeout(function() { saveBtn.innerHTML = orig; saveBtn.style.borderColor = ''; saveBtn.style.color = ''; }, 2000);
        }

        if (typeof markClean === 'function') markClean();
        netoptRefreshScenarioList(projectId);
    } catch(error) {
        console.error('Netopt save error:', error);
        alert('Error saving scenario: ' + error.message);
    }
}

// Load a netopt scenario from Supabase
async function netoptLoadScenario(scenarioId) {
    try {
        var scenarios = await cmFetchTable('netopt_scenarios', 'id=eq.' + scenarioId);
        if (scenarios.length === 0) { alert('Scenario not found'); return; }

        var scenario = scenarios[0];
        netoptActiveScenarioId = scenario.id;
        document.getElementById('netopt-scenario-name').value = scenario.scenario_name || '';

        netoptApplyInputs(scenario);
    } catch(error) {
        console.error('Netopt load error:', error);
        alert('Error loading scenario: ' + error.message);
    }
}

// List netopt scenarios
async function netoptListScenarios(projectId) {
    try {
        var filter = projectId ? 'project_id=eq.' + projectId : 'project_id=is.null';
        return await cmFetchTable('netopt_scenarios', filter);
    } catch(error) {
        console.error('Netopt list error:', error);
        return [];
    }
}

// Delete a netopt scenario
async function netoptDeleteScenario(scenarioId) {
    try {
        if (!confirm('Delete this scenario?')) return;
        await cmApiDelete('netopt_scenarios', scenarioId);
        if (netoptActiveScenarioId === scenarioId) netoptActiveScenarioId = null;
        netoptRefreshScenarioList(window.activeCostModelProjectId || null);
    } catch(error) {
        console.error('Netopt delete error:', error);
        alert('Error deleting scenario: ' + error.message);
    }
}

// Refresh netopt scenario dropdown
async function netoptRefreshScenarioList(projectId) {
    try {
        var scenarios = await netoptListScenarios(projectId);
        var select = document.getElementById('netopt-scenario-select');
        if (select) {
            select.innerHTML = '<option value="">-- Select scenario --</option>';
            scenarios.forEach(function(s) {
                var opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.scenario_name;
                select.appendChild(opt);
            });
        }
    } catch(error) {
        console.error('Error refreshing netopt scenario list:', error);
    }
}

// Initialize calculator on first view
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('wsc-peakunits')) {
    toggleStorageOptions();
    toggleFwdPick();
    calcWarehouse();

    // Bind ALL calculator inputs via JS (backup for inline oninput)
    var calcInputIds = [
      'wsc-peakunits','wsc-avgunits',
      'wsc-pct-fullpal','wsc-pct-ctnpal','wsc-pct-ctnshelv',
      'wsc-upp','wsc-upc-pal','wsc-cpp','wsc-upc-shelv','wsc-cpl',
      'wsc-hcbuf',
      'wsc-clearht','wsc-loadht',
      'wsc-bulkdp','wsc-stackhi','wsc-mixrack',
      'wsc-inpal','wsc-outpal','wsc-pdph','wsc-dockhr','wsc-office',
      'wsc-fwd-skus','wsc-fwd-days','wsc-ob-units','wsc-op-days'
    ];
    for (var i = 0; i < calcInputIds.length; i++) {
      var el = document.getElementById(calcInputIds[i]);
      if (el) {
        el.addEventListener('input', calcWarehouse);
        el.addEventListener('change', calcWarehouse);
      }
    }
    // Also bind dropdowns
    var selIds = ['wsc-storetype','wsc-aisletype','wsc-rackdir','wsc-dockconfig','wsc-fwd-type'];
    for (var j = 0; j < selIds.length; j++) {
      var sel = document.getElementById(selIds[j]);
      if (sel) sel.addEventListener('change', function() { toggleStorageOptions(); calcWarehouse(); });
    }
    // Bind checkboxes
    var cbIds = ['wsc-fwd','wsc-vas','wsc-ret','wsc-chg','wsc-stg'];
    for (var k = 0; k < cbIds.length; k++) {
      var cb = document.getElementById(cbIds[k]);
      if (cb) cb.addEventListener('change', calcWarehouse);
    }
  }

  // Initialize Network Optimization demand list
  if (document.getElementById('net-demand-list')) {
    renderDemandList();
  }
}); // end DOMContentLoaded

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE NETWORK OPTIMIZATION (NETOPT) — Full Module
// ═══════════════════════════════════════════════════════════════

// ── NETWORK OPTIMIZATION MODULE ──

var netoptState = {
  facilities: [],
  demands: [],
  suppliers: [],   // B5: Inbound origin points
  transport: {
    outboundPerUnitMile: 0.00296,
    inboundPerUnitMile: 0.00178,
    ltlSurcharge: 25,
    truckSpeedMiPerDay: 500
  },
  constraints: {
    serviceLevelPct: 95,
    minFacilities: 1,
    maxFacilities: 5,
    budgetCap: null,
    inventoryCarryPct: 15,
    globalMaxDays: 3,
    hardConstraint: false,
    targetServicePct: 95
  },
  results: null,
  activeTab: 'setup',
  solverMode: 'heuristic',
  mapInitialized: false,
  netoptMap: null,
  mapMarkers: [],
  mapPolylines: [],
  heatLayer: null,
  zoneLayers: [],
  mapMode: 'markers' // 'markers', 'heat', 'both', 'zones'
};

var netoptRateMode = 'market'; // 'market' or 'manual'
var netoptMarketRates = { datContract: null, datSpot: null, diesel: null, fscPct: null, lastUpdated: null };
var NETOPT_DIESEL_BASELINE = 2.50; // DOE baseline for fuel surcharge calculation

// Fetch live freight rates from Supabase
async function netoptFetchFreightRates() {
  var freshEl = document.getElementById('netopt-rate-freshness');
  if (freshEl) freshEl.textContent = 'Loading…';
  try {
    var [rates, fuels] = await Promise.all([
      cmFetchTable('freight_rates', 'order=report_date.desc&limit=10'),
      cmFetchTable('fuel_prices', 'order=report_date.desc&limit=5')
    ]);

    // Extract latest truck rates
    var datContract = rates.find(r => r.index_name && r.index_name.indexOf('Contract Van') >= 0);
    var datSpot = rates.find(r => r.index_name && r.index_name.indexOf('Spot Van') >= 0);
    var diesel = fuels.find(f => f.fuel_type && f.fuel_type.toLowerCase().indexOf('diesel') >= 0);

    netoptMarketRates.datContract = datContract ? parseFloat(datContract.rate) : null;
    netoptMarketRates.datSpot = datSpot ? parseFloat(datSpot.rate) : null;
    netoptMarketRates.diesel = diesel ? parseFloat(diesel.price_per_gallon) : null;
    netoptMarketRates.lastUpdated = datContract ? datContract.report_date : null;

    // Calculate fuel surcharge: (current - baseline) / baseline * fuel-portion-of-linehaul
    // Industry standard: fuel ~30% of linehaul cost, surcharge covers delta
    if (netoptMarketRates.diesel && netoptMarketRates.diesel > NETOPT_DIESEL_BASELINE) {
      netoptMarketRates.fscPct = Math.round(((netoptMarketRates.diesel - NETOPT_DIESEL_BASELINE) / NETOPT_DIESEL_BASELINE) * 100 * 10) / 10;
    } else {
      netoptMarketRates.fscPct = 0;
    }

    // Update market rate display cards
    var el;
    el = document.getElementById('netopt-rate-dat-contract');
    if (el) el.textContent = netoptMarketRates.datContract ? fmtNum(netoptMarketRates.datContract, 2, '$') : '—';
    el = document.getElementById('netopt-rate-dat-contract-chg');
    if (el && datContract && datContract.wow_change != null) {
      var chg = parseFloat(datContract.wow_change);
      el.textContent = (chg >= 0 ? '▲' : '▼') + ' ' + fmtNum(Math.abs(chg), 1) + '% WoW';
      el.style.color = chg >= 0 ? 'var(--ies-green)' : 'var(--ies-red)';
    }

    el = document.getElementById('netopt-rate-dat-spot');
    if (el) el.textContent = netoptMarketRates.datSpot ? fmtNum(netoptMarketRates.datSpot, 2, '$') : '—';
    el = document.getElementById('netopt-rate-dat-spot-chg');
    if (el && datSpot && datSpot.wow_change != null) {
      var chg2 = parseFloat(datSpot.wow_change);
      el.textContent = (chg2 >= 0 ? '▲' : '▼') + ' ' + fmtNum(Math.abs(chg2), 1) + '% WoW';
      el.style.color = chg2 >= 0 ? 'var(--ies-green)' : 'var(--ies-red)';
    }

    el = document.getElementById('netopt-rate-diesel');
    if (el) el.textContent = netoptMarketRates.diesel ? fmtNum(netoptMarketRates.diesel, 2, '$') : '—';
    el = document.getElementById('netopt-rate-diesel-chg');
    if (el && diesel && diesel.week_over_week_change != null) {
      var chg3 = parseFloat(diesel.week_over_week_change);
      el.textContent = (chg3 >= 0 ? '▲' : '▼') + ' ' + fmtNum(Math.abs(chg3), 3, '$') + ' WoW';
      el.style.color = chg3 >= 0 ? 'var(--ies-red)' : 'var(--ies-green)'; // Red = higher fuel cost
    }

    el = document.getElementById('netopt-rate-fsc');
    if (el) el.textContent = netoptMarketRates.fscPct != null ? fmtNum(netoptMarketRates.fscPct, 1) + '%' : '—';

    // Update freshness indicator
    if (freshEl && netoptMarketRates.lastUpdated) {
      var d = new Date(netoptMarketRates.lastUpdated);
      freshEl.textContent = 'Updated ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      freshEl.style.color = 'var(--ies-green)';
    }

    // Auto-populate rate fields if in market mode
    if (netoptRateMode === 'market') {
      netoptApplyMarketRates();
    }

  } catch(err) {
    console.error('Failed to fetch freight rates:', err);
    if (freshEl) { freshEl.textContent = 'Failed to load'; freshEl.style.color = 'var(--ies-red)'; }
  }
}

// Apply market rates to input fields
function netoptApplyMarketRates() {
  if (netoptMarketRates.datContract) {
    document.getElementById('netopt-tl-rate').value = netoptMarketRates.datContract.toFixed(2);
    document.getElementById('netopt-tl-rate-source').textContent = 'Source: DAT Contract Van (live)';
  }
  if (netoptMarketRates.fscPct != null) {
    document.getElementById('netopt-fuel-surcharge').value = netoptMarketRates.fscPct.toFixed(1);
    document.getElementById('netopt-fsc-source').textContent = 'Diesel ' + fmtNum(netoptMarketRates.diesel || 0, 2, '$') + ' vs ' + fmtNum(NETOPT_DIESEL_BASELINE, 2, '$') + ' baseline';
  }
  netoptRecalcAllCosts();
}

// Toggle between market rates, manual, and CSV
function netoptSetRateMode(mode) {
  netoptRateMode = mode;
  var mBtn = document.getElementById('netopt-rate-mode-market');
  var oBtn = document.getElementById('netopt-rate-mode-manual');
  var cBtn = document.getElementById('netopt-rate-mode-csv');
  var desc = document.getElementById('netopt-rate-mode-desc');
  var csvPanel = document.getElementById('netopt-csv-upload-panel');
  var tlInput = document.getElementById('netopt-tl-rate');
  var fscInput = document.getElementById('netopt-fuel-surcharge');

  // Reset all buttons
  [mBtn, oBtn, cBtn].forEach(function(b) { if (b) { b.style.background = '#fff'; b.style.color = 'var(--ies-navy)'; }});

  if (mode === 'market') {
    mBtn.style.background = 'var(--ies-blue)'; mBtn.style.color = '#fff';
    desc.textContent = 'Using latest DAT linehaul rates + fuel surcharge';
    csvPanel.style.display = 'none';
    tlInput.style.background = '#f1f5f9'; fscInput.style.background = '#f1f5f9';
    netoptApplyMarketRates();
  } else if (mode === 'csv') {
    cBtn.style.background = 'var(--ies-blue)'; cBtn.style.color = '#fff';
    desc.textContent = 'Using uploaded carrier rate cards';
    csvPanel.style.display = 'block';
    tlInput.style.background = ''; fscInput.style.background = '';
  } else {
    oBtn.style.background = 'var(--ies-blue)'; oBtn.style.color = '#fff';
    desc.textContent = 'Enter your own contracted or negotiated rates';
    csvPanel.style.display = 'none';
    tlInput.style.background = ''; fscInput.style.background = '';
    document.getElementById('netopt-tl-rate-source').textContent = 'Source: Manual entry';
    document.getElementById('netopt-fsc-source').textContent = 'Manual fuel surcharge';
  }
}

// ── Parcel Zone Rate Tables (published GRI-adjusted 2025/2026 estimates) ──
// Rows: weight brackets. Columns: zone 2-8. Values: $/package (UPS Ground published)
var NETOPT_PARCEL_RATES = {
  ups: {
    weights: [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 70],
    zones: [2, 3, 4, 5, 6, 7, 8],
    rates: [
      [8.45, 8.85, 9.35, 10.20, 11.10, 12.25, 13.80],  // 1 lb
      [8.90, 9.45, 10.05, 10.95, 12.00, 13.35, 15.10],  // 2 lb
      [9.35, 10.00, 10.75, 11.75, 12.90, 14.45, 16.40],  // 3 lb
      [10.25, 11.10, 12.10, 13.30, 14.70, 16.65, 19.00],  // 5 lb
      [12.50, 13.85, 15.30, 17.10, 19.20, 22.00, 25.50],  // 10 lb
      [14.75, 16.60, 18.50, 20.90, 23.70, 27.35, 32.00],  // 15 lb
      [17.00, 19.35, 21.70, 24.70, 28.20, 32.70, 38.50],  // 20 lb
      [21.50, 24.85, 28.10, 32.30, 37.20, 43.40, 51.50],  // 30 lb
      [26.00, 30.35, 34.50, 39.90, 46.20, 54.10, 64.50],  // 40 lb
      [30.50, 35.85, 40.90, 47.50, 55.20, 64.80, 77.50],  // 50 lb
      [39.50, 46.85, 53.70, 62.70, 73.20, 86.20, 103.50]  // 70 lb
    ]
  },
  fedex: {
    weights: [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 70],
    zones: [2, 3, 4, 5, 6, 7, 8],
    rates: [
      [8.30, 8.70, 9.20, 10.05, 10.90, 12.05, 13.55],
      [8.75, 9.30, 9.90, 10.80, 11.85, 13.15, 14.85],
      [9.20, 9.85, 10.60, 11.55, 12.70, 14.20, 16.10],
      [10.10, 10.95, 11.95, 13.10, 14.50, 16.40, 18.70],
      [12.30, 13.65, 15.10, 16.85, 18.95, 21.70, 25.10],
      [14.50, 16.35, 18.25, 20.60, 23.40, 26.95, 31.50],
      [16.75, 19.05, 21.40, 24.35, 27.80, 32.20, 37.90],
      [21.15, 24.45, 27.70, 31.80, 36.60, 42.70, 50.70],
      [25.60, 29.85, 33.95, 39.30, 45.50, 53.30, 63.50],
      [30.00, 35.30, 40.30, 46.80, 54.40, 63.80, 76.30],
      [38.90, 46.10, 52.90, 61.70, 72.10, 84.90, 101.90]
    ]
  },
  usps: {
    weights: [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 70],
    zones: [2, 3, 4, 5, 6, 7, 8],
    rates: [
      [7.90, 8.10, 8.40, 8.90, 9.50, 10.30, 11.20],
      [8.10, 8.40, 8.80, 9.40, 10.10, 11.00, 12.10],
      [8.30, 8.70, 9.20, 9.90, 10.70, 11.70, 13.00],
      [8.90, 9.50, 10.20, 11.10, 12.20, 13.50, 15.20],
      [10.50, 11.50, 12.60, 13.90, 15.50, 17.50, 20.00],
      [12.20, 13.50, 14.90, 16.70, 18.80, 21.50, 24.80],
      [13.90, 15.50, 17.20, 19.50, 22.10, 25.50, 29.60],
      [17.30, 19.50, 21.80, 25.10, 28.70, 33.50, 39.20],
      [20.70, 23.50, 26.40, 30.70, 35.30, 41.50, 48.80],
      [24.10, 27.50, 31.00, 36.30, 41.90, 49.50, 58.40],
      [30.90, 35.50, 40.20, 47.50, 55.10, 65.50, 77.60]
    ]
  }
};

// Custom rates holder (populated by CSV upload)
NETOPT_PARCEL_RATES.custom = JSON.parse(JSON.stringify(NETOPT_PARCEL_RATES.ups));

// LTL base tariff rates ($/cwt by class, 500mi average — simplified CZAR-lite)
var NETOPT_LTL_TARIFF = {
  // class: base $/CWT at different weight breaks (500lb, 1000lb, 2000lb, 5000lb, 10000lb, 20000lb)
  '50':  [22.50, 18.00, 14.50, 11.00, 8.50, 6.80],
  '55':  [25.00, 20.00, 16.10, 12.20, 9.45, 7.55],
  '60':  [27.50, 22.00, 17.70, 13.40, 10.40, 8.30],
  '65':  [30.00, 24.00, 19.30, 14.65, 11.35, 9.05],
  '70':  [32.50, 26.00, 20.90, 15.85, 12.30, 9.80],
  '77.5':[36.00, 28.80, 23.15, 17.55, 13.60, 10.85],
  '85':  [39.50, 31.60, 25.40, 19.25, 14.90, 11.90],
  '92.5':[43.00, 34.40, 27.65, 20.95, 16.25, 12.95],
  '100': [46.50, 37.20, 29.90, 22.70, 17.60, 14.00],
  '110': [51.00, 40.80, 32.80, 24.90, 19.30, 15.35],
  '125': [57.00, 45.60, 36.65, 27.80, 21.55, 17.15],
  '150': [65.00, 52.00, 41.80, 31.70, 24.55, 19.55],
  '175': [73.00, 58.40, 46.95, 35.60, 27.55, 21.95],
  '200': [81.00, 64.80, 52.10, 39.50, 30.60, 24.35],
  '250': [97.00, 77.60, 62.40, 47.30, 36.65, 29.15],
  '300': [113.00, 90.40, 72.70, 55.15, 42.75, 34.00],
  '400': [145.00, 116.00, 93.30, 70.75, 54.85, 43.60],
  '500': [177.00, 141.60, 113.85, 86.35, 66.90, 53.20]
};

// Distance-to-zone mapping for parcel (rough: miles → UPS/FedEx zone)
function netoptMilesToZone(miles) {
  if (miles <= 150) return 2;
  if (miles <= 300) return 3;
  if (miles <= 600) return 4;
  if (miles <= 1000) return 5;
  if (miles <= 1400) return 6;
  if (miles <= 1800) return 7;
  return 8;
}

// Distance multiplier for LTL (base tariff is ~500mi; scale for actual distance)
function netoptLTLDistMultiplier(miles) {
  if (miles <= 100) return 0.55;
  if (miles <= 250) return 0.70;
  if (miles <= 500) return 1.00;
  if (miles <= 750) return 1.20;
  if (miles <= 1000) return 1.40;
  if (miles <= 1500) return 1.65;
  return 1.90;
}

// Get parcel cost for a specific zone and weight
function netoptGetParcelRate(carrier, weightLbs, zone) {
  var table = NETOPT_PARCEL_RATES[carrier] || NETOPT_PARCEL_RATES.ups;
  var zoneIdx = zone - 2; // zones start at 2
  if (zoneIdx < 0) zoneIdx = 0;
  if (zoneIdx >= table.zones.length) zoneIdx = table.zones.length - 1;

  // Find weight bracket
  var rowIdx = 0;
  for (var i = 0; i < table.weights.length; i++) {
    if (weightLbs >= table.weights[i]) rowIdx = i;
  }
  return table.rates[rowIdx][zoneIdx];
}

// Get LTL cost for a specific class, weight, and distance
function netoptGetLTLRate(freightClass, weightLbs, miles) {
  var tariff = NETOPT_LTL_TARIFF[String(freightClass)] || NETOPT_LTL_TARIFF['70'];
  // Find weight break index: 500, 1000, 2000, 5000, 10000, 20000
  var breaks = [500, 1000, 2000, 5000, 10000, 20000];
  var breakIdx = 0;
  for (var i = 0; i < breaks.length; i++) {
    if (weightLbs >= breaks[i]) breakIdx = i;
  }
  var baseCWT = tariff[breakIdx]; // $/CWT at this break
  var distMult = netoptLTLDistMultiplier(miles);
  var cwt = weightLbs / 100;
  return baseCWT * cwt * distMult; // total $ for this shipment before discount/FSC
}

// Balance mode mix to 100%
function netoptBalanceModeMix(changed) {
  var tl = parseFloat(document.getElementById('netopt-mode-tl-pct').value) || 0;
  var ltl = parseFloat(document.getElementById('netopt-mode-ltl-pct').value) || 0;
  var parcel = parseFloat(document.getElementById('netopt-mode-parcel-pct').value) || 0;
  var total = tl + ltl + parcel;
  var warn = document.getElementById('netopt-mode-mix-warn');
  if (Math.abs(total - 100) > 0.5) {
    warn.style.display = 'block';
    warn.textContent = 'Mode mix totals ' + total + '% — must equal 100%';
  } else {
    warn.style.display = 'none';
  }
  // Update labels
  var tlLabel = document.getElementById('netopt-tl-pct-label');
  var ltlLabel = document.getElementById('netopt-ltl-pct-label');
  var parcelLabel = document.getElementById('netopt-parcel-pct-label');
  if (tlLabel) tlLabel.textContent = tl + '% of volume';
  if (ltlLabel) ltlLabel.textContent = ltl + '% of volume';
  if (parcelLabel) parcelLabel.textContent = parcel + '% of volume';
  netoptRecalcAllCosts();
}

// Populate parcel zone rate table display
function netoptRenderParcelRateTable() {
  var carrier = document.getElementById('netopt-parcel-carrier').value || 'ups';
  var table = NETOPT_PARCEL_RATES[carrier] || NETOPT_PARCEL_RATES.ups;
  var discount = parseFloat(document.getElementById('netopt-parcel-discount').value) || 0;
  var tbody = document.getElementById('netopt-parcel-rate-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var labels = ['1 lb','2 lb','3 lb','5 lb','10 lb','15 lb','20 lb','30 lb','40 lb','50 lb','70 lb'];
  table.rates.forEach(function(row, i) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ies-gray-100)';
    var html = '<td style="padding:6px 10px;font-weight:600;color:var(--ies-navy);">' + labels[i] + '</td>';
    row.forEach(function(rate) {
      var net = rate * (1 - discount / 100);
      html += '<td style="padding:6px 10px;text-align:right;color:var(--ies-gray-600);">' + fmtNum(net, 2, '$') + '</td>';
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

// CSV rate card parser
function netoptParseRateCSV(mode, input) {
  var file = input.files[0];
  if (!file) return;
  var status = document.getElementById('netopt-csv-' + mode + '-status');
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var lines = e.target.result.split('\n').filter(function(l) { return l.trim(); });
      if (mode === 'parcel' && lines.length > 1) {
        // Parse parcel CSV: header is weight,zone2,zone3,...zone8
        var rates = [];
        var weights = [];
        var parseErrors = [];
        var expectedCols = lines[0].split(',').length;
        for (var i = 1; i < lines.length; i++) {
          var cols = lines[i].split(',').map(function(c) { return parseFloat(c.trim()); });
          if (cols.length < expectedCols) {
            parseErrors.push('Row ' + i + ': expected ' + expectedCols + ' columns, got ' + cols.length);
            continue;
          }
          if (isNaN(cols[0]) || cols[0] <= 0) {
            parseErrors.push('Row ' + i + ': invalid weight "' + lines[i].split(',')[0].trim() + '"');
            continue;
          }
          var rowRates = cols.slice(1);
          var hasNaN = rowRates.some(function(v) { return isNaN(v) || v < 0; });
          if (hasNaN) {
            parseErrors.push('Row ' + i + ': contains non-numeric or negative rate values');
            continue;
          }
          weights.push(cols[0]);
          rates.push(rowRates);
        }
        if (weights.length === 0) {
          status.textContent = 'No valid rows found' + (parseErrors.length ? ': ' + parseErrors[0] : '');
          status.style.color = 'var(--ies-red)';
          return;
        }
        // Verify weights are ascending
        for (var w = 1; w < weights.length; w++) {
          if (weights[w] <= weights[w-1]) {
            parseErrors.push('Warning: weights not ascending at row ' + (w+1));
            break;
          }
        }
        NETOPT_PARCEL_RATES.custom = { weights: weights, zones: [2,3,4,5,6,7,8], rates: rates };
        document.getElementById('netopt-parcel-carrier').value = 'custom';
        var msg = weights.length + ' rows loaded';
        if (parseErrors.length) msg += ' (' + parseErrors.length + ' skipped)';
        status.textContent = msg;
        status.style.color = parseErrors.length ? 'var(--ies-orange)' : 'var(--ies-green)';
      } else if (mode === 'tl' && lines.length > 1) {
        // Simple avg: take mean of rate column
        var total = 0, count = 0;
        for (var i = 1; i < lines.length; i++) {
          var cols = lines[i].split(',');
          var rate = parseFloat(cols[cols.length - 1]);
          if (!isNaN(rate)) { total += rate; count++; }
        }
        if (count > 0) {
          document.getElementById('netopt-tl-rate').value = (total / count).toFixed(2);
          status.textContent = count + ' lanes, avg ' + fmtNum(total / count, 2, '$') + '/mi';
          status.style.color = 'var(--ies-green)';
        }
      } else if (mode === 'ltl' && lines.length > 1) {
        status.textContent = (lines.length - 1) + ' rate entries loaded';
        status.style.color = 'var(--ies-green)';
      }
      netoptRecalcAllCosts();
    } catch(err) {
      status.textContent = 'Parse error: ' + err.message;
      status.style.color = 'var(--ies-red)';
    }
  };
  reader.readAsText(file);
}

// Download CSV template
function netoptDownloadRateTemplate() {
  var tl = 'origin_city,origin_state,dest_city,dest_state,rate_per_mile\nAtlanta,GA,New York,NY,2.45\nChicago,IL,Los Angeles,CA,2.60\n';
  var ltl = 'freight_class,weight_break_lbs,rate_per_cwt\n70,500,32.50\n70,1000,26.00\n100,500,46.50\n';
  var parcel = 'weight_lbs,zone2,zone3,zone4,zone5,zone6,zone7,zone8\n1,8.45,8.85,9.35,10.20,11.10,12.25,13.80\n5,10.25,11.10,12.10,13.30,14.70,16.65,19.00\n';
  var combined = '--- TL RATE CARD ---\n' + tl + '\n--- LTL RATE CARD ---\n' + ltl + '\n--- PARCEL RATE CARD ---\n' + parcel;
  var blob = new Blob([combined], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rate_card_templates.csv';
  a.click();
}

// ── Master cost recalculation (replaces old netoptRecalcUnitMileCost) ──
function netoptRecalcUnitMileCost() { netoptRecalcAllCosts(); }

function netoptRecalcAllCosts() {
  // TL cost per unit-mile
  var tlRate = parseFloat(document.getElementById('netopt-tl-rate').value) || 2.37;
  var fscPct = parseFloat(document.getElementById('netopt-fuel-surcharge').value) || 0;
  var unitsPer = parseFloat(document.getElementById('netopt-units-per-tl').value) || 800;
  var inboundRatio = parseFloat(document.getElementById('netopt-inbound-ratio').value) || 60;
  var tlAllIn = tlRate * (1 + fscPct / 100);
  var tlUnitMile = tlAllIn / unitsPer;

  // Display TL $/unit-mile
  var tlDisplay = document.getElementById('netopt-tl-unit-mile');
  if (tlDisplay) tlDisplay.textContent = fmtNum(tlUnitMile, 5, '$');

  // LTL cost per unit-mile (at reference distance of 500mi)
  var ltlWeight = parseFloat(document.getElementById('netopt-ltl-avg-weight').value) || 1500;
  var ltlClass = document.getElementById('netopt-ltl-class').value || '70';
  var ltlDiscount = parseFloat(document.getElementById('netopt-ltl-discount').value) || 65;
  var ltlFsc = parseFloat(document.getElementById('netopt-ltl-fsc').value) || 28;
  var ltlUnits = parseFloat(document.getElementById('netopt-units-per-ltl').value) || 150;
  var ltlShipmentCost = netoptGetLTLRate(ltlClass, ltlWeight, 500); // base at 500mi
  ltlShipmentCost = ltlShipmentCost * (1 - ltlDiscount / 100) * (1 + ltlFsc / 100);
  var ltlUnitMile = ltlShipmentCost / ltlUnits / 500; // per unit per mile

  var ltlDisplay = document.getElementById('netopt-ltl-unit-mile');
  if (ltlDisplay) ltlDisplay.textContent = fmtNum(ltlUnitMile, 5, '$');

  // Parcel cost per unit (at reference zone 5)
  var carrier = document.getElementById('netopt-parcel-carrier').value || 'ups';
  var parcelWeight = parseFloat(document.getElementById('netopt-parcel-avg-weight').value) || 5;
  var parcelDiscount = parseFloat(document.getElementById('netopt-parcel-discount').value) || 35;
  var resiCharge = parseFloat(document.getElementById('netopt-parcel-resi').value) || 4.50;
  var resiPct = parseFloat(document.getElementById('netopt-parcel-resi-pct').value) || 75;
  var zone5Rate = netoptGetParcelRate(carrier, parcelWeight, 5);
  var parcelUnitCost = zone5Rate * (1 - parcelDiscount / 100) + (resiCharge * resiPct / 100);

  var parcelDisplay = document.getElementById('netopt-parcel-unit-cost');
  if (parcelDisplay) parcelDisplay.textContent = fmtNum(parcelUnitCost, 2, '$');

  // Render parcel rate table
  netoptRenderParcelRateTable();

  // Mode mix
  var tlPct = parseFloat(document.getElementById('netopt-mode-tl-pct').value) || 0;
  var ltlPct = parseFloat(document.getElementById('netopt-mode-ltl-pct').value) || 0;
  var parcelPct = parseFloat(document.getElementById('netopt-mode-parcel-pct').value) || 0;

  // Blended outbound $/unit-mile
  // TL and LTL are distance-based ($/unit-mile), parcel is zone-based ($/unit flat + distance component)
  // For optimizer: convert parcel to $/unit-mile equivalent at avg 500mi haul
  var parcelPerUnitMile = parcelUnitCost / 500;
  var blendedUnitMile = (tlUnitMile * tlPct / 100) + (ltlUnitMile * ltlPct / 100) + (parcelPerUnitMile * parcelPct / 100);
  var inboundUnitMile = blendedUnitMile * (inboundRatio / 100);

  // Update blended display
  var blendTl = document.getElementById('netopt-blend-tl');
  var blendLtl = document.getElementById('netopt-blend-ltl');
  var blendParcel = document.getElementById('netopt-blend-parcel');
  var blendTotal = document.getElementById('netopt-blend-total');
  if (blendTl) blendTl.textContent = fmtNum(tlUnitMile * tlPct / 100, 5, '$');
  if (blendLtl) blendLtl.textContent = fmtNum(ltlUnitMile * ltlPct / 100, 5, '$');
  if (blendParcel) blendParcel.textContent = fmtNum(parcelPerUnitMile * parcelPct / 100, 5, '$');
  if (blendTotal) blendTotal.textContent = fmtNum(blendedUnitMile, 5, '$');

  // Update hidden inputs for the optimizer
  document.getElementById('netopt-outbound-cost').value = blendedUnitMile.toFixed(6);
  document.getElementById('netopt-inbound-cost').value = inboundUnitMile.toFixed(6);

  // Store mode-specific rates on netoptState.transport for detailed solver
  netoptState.transport.tlUnitMile = tlUnitMile;
  netoptState.transport.ltlUnitMile = ltlUnitMile;
  netoptState.transport.parcelUnitCost = parcelUnitCost;
  netoptState.transport.modeMix = { tl: tlPct / 100, ltl: ltlPct / 100, parcel: parcelPct / 100 };
  netoptState.transport.parcelCarrier = carrier;
  netoptState.transport.parcelDiscount = parcelDiscount;
  netoptState.transport.parcelWeight = parcelWeight;
  netoptState.transport.parcelResi = resiCharge;
  netoptState.transport.parcelResiPct = resiPct;
  netoptState.transport.ltlClass = ltlClass;
  netoptState.transport.ltlWeight = ltlWeight;
  netoptState.transport.ltlDiscount = ltlDiscount;
  netoptState.transport.ltlFsc = ltlFsc;
  netoptState.transport.ltlUnits = ltlUnits;

  netoptUpdateKPI();
}


// ══════════════════════════════════════════════════════════════════════
// DESIGN TOOLS LANDING PAGES — Scenario Management
// ══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// ENTERPRISE NETWORK OPT — LANDING PAGE
// ═══════════════════════════════════════════════════════════════════
async function netoptShowLanding() {
  var landing = document.getElementById('netopt-landing');
  var tool = document.getElementById('netopt-tool');
  if (landing) landing.style.display = 'block';
  if (tool) tool.style.display = 'none';
  await netoptLoadScenariosList();
}

async function netoptShowTool() {
  var landing = document.getElementById('netopt-landing');
  var tool = document.getElementById('netopt-tool');
  if (landing) landing.style.display = 'none';
  if (tool) tool.style.display = 'block';
}

async function netoptLoadScenariosList() {
  try {
    var scenarios = await netoptListScenarios(window.activeCostModelProjectId || null);
    var grid = document.getElementById('netopt-landing-grid');

    if (!grid) return;

    if (scenarios.length === 0) {
      grid.innerHTML = '';
      dtToggleLandingEmpty('netopt-landing-actions', 'netopt-empty-state', true);
      return;
    }

    dtToggleLandingEmpty('netopt-landing-actions', 'netopt-empty-state', false);

    grid.innerHTML = scenarios.map(function(s) {
      return '<div class="dt-landing-card">' +
        '<div onclick="netoptLoadScenario(\'' + esc(s.id) + '\'); netoptShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + esc(s.scenario_name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">Cost: $' + (s.result_total_cost ? s.result_total_cost.toLocaleString(undefined, {maximumFractionDigits: 0}) : '—') + ' | Mode: ' + (s.solver_mode || '—') + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'netopt_scenarios\',\'' + esc(s.id) + '\',\'netopt\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'netopt_scenarios\',\'' + esc(s.id) + '\',\'netopt\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
        '</div></div>';
    }).join('');
  } catch (e) {
    console.error('Error loading scenarios:', e);
  }
}

function netoptNewScenario() {
  // Clear netopt state for new scenario
  if (typeof netoptState !== 'undefined') {
    netoptState.facilities = [];
    netoptState.demands = [];
    netoptState.results = null;
    netoptRenderFacilitiesTable();
    netoptRenderDemandsTable();
  }
  netoptShowTool();
}

// NOTE: fmShowLanding, fmShowTool, fmLoadScenariosList, fmNewScenario
// are defined in fleet-modeler.js alongside the other fm* functions.

