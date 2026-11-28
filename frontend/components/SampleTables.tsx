export function AnovaTable() {
  return (
    <figure className="paper">
      <figcaption>جدول ۱. تحلیل واریانس یک‌طرفه (نمونه)</figcaption>
      <table>
        <thead><tr><th>منبع تغییرات</th><th>SS</th><th>df</th><th>MS</th><th>F</th><th>p</th></tr></thead>
        <tbody>
          <tr><td>بین گروه‌ها</td><td>42.18</td><td>2</td><td>21.09</td><td>6.37</td><td>.005</td></tr>
          <tr><td>درون گروه‌ها</td><td>89.41</td><td>27</td><td>3.31</td><td></td><td></td></tr>
          <tr className="total"><td>کل</td><td>131.59</td><td>29</td><td></td><td></td><td></td></tr>
        </tbody>
      </table>
      <p className="note"><i>Note.</i> η² = .32</p>
    </figure>
  );
}

export function ModelTable() {
  return (
    <figure className="paper">
      <figcaption>جدول ۲. مقایسه‌ی مدل‌های طبقه‌بندی روی داده‌ی آزمون (نمونه)</figcaption>
      <table>
        <thead><tr><th>مدل</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th><th>AUC</th></tr></thead>
        <tbody>
          <tr><td>رگرسیون لجستیک</td><td>.81</td><td>.76</td><td>.72</td><td>.74</td><td>.86</td></tr>
          <tr><td>جنگل تصادفی</td><td>.85</td><td>.80</td><td>.78</td><td>.79</td><td>.91</td></tr>
          <tr className="total"><td>گرادیان بوستینگ</td><td>.87</td><td>.83</td><td>.80</td><td>.81</td><td>.93</td></tr>
        </tbody>
      </table>
      <p className="note"><i>Note.</i> Stratified 5-fold CV</p>
    </figure>
  );
}
