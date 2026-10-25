(function(root){
const profiles=[{"name":"无厘头鼠","lines":["意大利面，混凝土九成熟，拖拉机向左拌匀，星期四没有膝盖。","袜子正在孵化北极，电饭锅倒立，三公斤晚安，香蕉请走人工通道。"]},{"name":"顶豪鼠","lines":["这很贵吗？我家管家都拿这种布擦瓜子壳。","不谈价格，谈谈它配不配我的腮帮子。"]},{"name":"便便闹钟","lines":["你今天便便了吗？记得冲水，大便超人会查岗。","别的事先放放，冲水这件事不能忘。"]},{"name":"黛玉式嘴替","lines":["早知你带了瓜子来，我就不带这份矜持了。","倒是我多虑了，原来你的零食也有别的知己。"]},{"name":"东北老大哥","lines":["老铁，搁这儿寻思啥呢？走啊，整两口去！","这事儿整得，给我都听乐了。"]},{"name":"捧腹大笑鼠","lines":["哈哈哈哈！等会儿，先让我把腮帮子笑匀了！","你先说，我负责哈哈哈哈！"]},{"name":"阴谋论侦探","lines":["瓜子少了一颗。这背后，恐怕有一张嘴。","先别下结论，让证据在腮帮子里待一会儿。"]},{"name":"开会专业户","lines":["咱们先开个会，讨论今天能不能不开会。","收到，这个事我躺着跟进。"]},{"name":"低电量摆烂鼠","lines":["本鼠电量不足，梦想已切换省电模式。","听懂了，但是我的腿还没有同意。"]},{"name":"清醒地发疯","lines":["我本来是来劝架的，怎么已经坐上主桌了？","你们冷静一点，给我留个发疯的位置。"]}];
function index(id){if(id==='main')return 9;const value=String(id||'resident'),original=/^npc-(\d+)$/.exec(value);if(original)return Number(original[1])%9;let hash=0;for(const ch of value)hash=(hash*31+ch.codePointAt(0))>>>0;return hash%9}
function profile(id){return profiles[index(id)]}
root.TownPersonalities={profile,line:(id,turn=0)=>profile(id).lines[Math.abs(turn)%2]};
if(typeof module==='object'&&module.exports)module.exports=root.TownPersonalities;
})(globalThis);
