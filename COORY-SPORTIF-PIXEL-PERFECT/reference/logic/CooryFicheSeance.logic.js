class Component extends DCLogic {
  renderVals() {
    const m = !!this.props.mobile;
    const P = [];
    for (let i = 0; i < 5; i++) { P.push([4, '100%', '#7776FF']); if (i < 4) P.push([1.75, '32%', '#c9c8f7']); }
    return {
      cols: m ? 'minmax(0,1fr)' : 'minmax(0,1fr) 300px',
      pad: m ? '20px 16px' : '26px',
      indent: m ? '0' : '42px',
      calmFlex: m ? '8' : '6',
      sep: m ? '' : ' ', labDir: m ? 'column' : 'row', labGap: m ? '1px' : '4px',
      reps: P.map(p => ({ f: String(p[0]), h: p[1], c: p[2] }))
    };
  }
}