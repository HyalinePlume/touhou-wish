import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';
const dir = new URL('.',import.meta.url);
const rows=JSON.parse(await fs.readFile(new URL('analysis.json',dir),'utf8'));
const wb=Workbook.create();
const s=wb.worksheets.add('逐曲分析');
s.showGridLines=false;s.tabColor='#23395B';
const headers=['对应人物','音频文件','完全静音开头（秒）','达到−35 dBFS（秒）','弱起/渐入判断','达到−60 dBFS（秒）','低声至达标间隔（秒）','达到−30 dBFS（秒）','全曲时长（秒）'];
s.getRange('A2').values=[['角色主题音频起音分析']];
s.getRange('A3').values=[[`共 ${rows.length} 曲。时间均从文件开头计算；检测口径见“检测说明”。原音频未修改。`]];
s.getRange('A5:I5').values=[headers];
const data=rows.map(r=>[r.people,r.file,r.exact,r.target??'全曲未达',r.category,r.low??'全曲未达',r.gap??'不适用',r.high??'全曲未达',r.duration]);
s.getRange(`A6:I${5+rows.length}`).values=data;
s.getRange(`A5:I${5+rows.length}`).format.font={name:'Microsoft YaHei',size:11,color:'#202D3A'};
s.getRange(`A5:I${5+rows.length}`).format.rowHeight=28;
s.getRange('A2').format.font={name:'Microsoft YaHei',size:16,bold:true,color:'#23395B'};
s.getRange('A3').format.font={name:'Microsoft YaHei',size:10,color:'#596675'};
const widths=[34,46,23,24,32,25,26,25,20];
widths.forEach((w,i)=>s.getRangeByIndexes(4,i,rows.length+1,1).format.columnWidth=w);
s.getRange('A5:I5').format={fill:'#23395B',font:{name:'Microsoft YaHei',size:11,bold:true,color:'#FFFFFF'},rowHeight:44,wrapText:true,horizontalAlignment:'center',verticalAlignment:'center'};
for(const col of ['C','D','F','G','H','I'])s.getRange(`${col}6:${col}${5+rows.length}`).setNumberFormat(col==='C'?'0.000000':'0.000');
for(let i=0;i<rows.length;i++) if(i%2===1)s.getRange(`A${i+6}:I${i+6}`).format.fill='#F2F5F9';
s.getRange(`D6:D${rows.length+5}`).conditionalFormats.add('dataBar',{color:'#B9D5EC'});
s.tables.add(`A5:I${rows.length+5}`,true,'AudioOnsets');
s.freezePanes.freezeRows(5);
const notes=wb.worksheets.add('检测说明');notes.showGridLines=false;
const lines=[
 ['检测说明','2026-11-02'],
 ['覆盖范围',`static/sfx/theme 中全部 ${rows.length} 个 MP3，全曲解码分析，一曲一行。`],
 ['人物来源','src/lib/data/characters.js。共用同一文件的人物合并列出；未引用文件明确标注。'],
 ['完全静音开头','从时间零到第一个任意声道非零浮点样本。严格按解码样本判断，不以低音量冒充完全静音。'],
 ['静音数值精度','内部按 44,100 Hz 样本定位，显示至小数点后六位。极轻的编码噪声也会结束“完全静音”。'],
 ['主阈值','−35 dBFS，作为本报告“明显起音”的统一参考。dBFS 为相对数字满幅的音量，不是扬声器声压。'],
 ['达标检测','每 10 毫秒计算双声道合并 RMS，连续 5 个窗口（50 毫秒）达标才记为起音。取该连续段起点。'],
 ['时间分辨率','阈值时间分辨率 10 毫秒；窗口起点可能比窗口内实际起音早最多约 10 毫秒。'],
 ['低声参考','−60 dBFS 用于识别很轻的起音；−30 dBFS 作为更严格的对照，辅助查看阈值敏感性。'],
 ['弱起/渐入候选','−60 到 −35 dBFS 起音间隔达到 0.300 秒，标为候选。只能说明存在低声阶段，不能自动判定音乐上的弱起或连续渐强。'],
 ['未达阈值','标注“全曲未达”，不以 0 或空白代替；相关间隔标注“不适用”。'],
 ['播放因素','只测文件波形，不包含浏览器加载延迟、应用音量渐强、设备音量和听音环境。'],
 ['解码方式','本机已有 FFmpeg，输出 44,100 Hz、双声道、32 位浮点 PCM，仅通过内存管道读取。'],
 ['只读验证','每首音频分析前后比较 SHA-256，全部一致。未裁剪、重编码或修改音频及应用配置。'],
 ['使用建议','达标时间用于比较和试听定位，不直接等于建议裁剪点；直接裁到阈值可能丢失有意保留的弱音。'],
 ['对应关系核对','全部 133 首音频均已对应到角色。解析时排除注释掉的旧配置，村民各编号共用一首主题曲。']
];
notes.getRange(`A2:B${lines.length+1}`).values=lines;
notes.getRange(`A2:B${lines.length+1}`).format={font:{name:'Microsoft YaHei',size:11,color:'#202D3A'},verticalAlignment:'center',rowHeight:46,wrapText:true};
notes.getRange('A2:A17').format.columnWidth=25;
notes.getRange('B2:B17').format.columnWidth=108;
notes.getRange('A2:B2').format={fill:'#23395B',font:{name:'Microsoft YaHei',size:12,color:'#FFFFFF',bold:true}};
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'逐曲分析!A5:I9',tableMaxRows:5,tableMaxCols:9,maxChars:3500})).ndjson);
for(const [sheetName,range,file] of [['逐曲分析','A2:E12','preview.png'],['检测说明','A2:B17','method.png']]){
 const p=await wb.render({sheetName,range,scale:1.3,format:'png'});
 await fs.writeFile(new URL(file,dir),new Uint8Array(await p.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(fileURLToPath(new URL('角色主题音频起音分析.xlsx',dir)));
console.log('Export complete');
