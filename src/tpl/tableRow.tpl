<td><%= data.id %></td>
<td><input id="creditAmount" type="text" value="<%= data.amount%>"></td>
<td><input id="installmentsQuantity" type="text" value="<%= data.quantity %>"></td>
<td><input id="interest" type="text" value="<%= data.interest %>"></td>
<td><span id="equalInterestSum"><%= data.equalInterestSum %></span></td>
<td><span id="equalInstallmentAmount"><%= data.equalInstallmentAmount %></span></td>
<td><span id="diminishingInterestsSum"><%= data.diminishingInterestsSum %></span></td>
<td><span id="diminishingFirstInstallmentAmount"><%= data.diminishingFirstInstallmentAmount %></span></td>
<td><span id="diminishingLastInstallmentAmount"><%= data.diminishingLastInstallmentAmount %></span></td>
