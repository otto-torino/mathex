/****************************************************
*
* forminput.js
*
* Implements the \FormInput extension for including text <input> elements in
* math expressions. This only works in HTML-CSS output (all browsers),
* and NativeMML output in Firefox (but not IE/MathPlayer or Opera).
*
* The macro is \FormInput{name} where "name" is the CSS id to use for the
* <input> element. The Default size is 2, but you can use an optional
* argument to set a different size, as in \FormInput[size]{name}. Finally,
* you can use a second optional parameter to specify a CSS class for the
* element (which can be styled to suit your needs). All the elements
* generated by this extension are in class MathJax_Input, so you can
* style that to change the default presentation.
*
* You can load this file via the config=file parameter on the script
* tag that loads MathJax.js, or by including it in the extensions
* array in your configuration.
*
* Be sure to change the loadComplete() address to the URL
* of the location of this file on your server.
*/
MathJax.Callback.Queue(
MathJax.Hub.Register.StartupHook("TeX Jax Ready",function () {
  var VERSION = "1.0";

  var TEX = MathJax.InputJax.TeX,
      TEXDEF = TEX.Definitions,
      MML = MathJax.ElementJax.mml,
      HTML = MathJax.HTML;

  TEXDEF.macros.FormInput = "FormInput";

  TEX.Parse.Augment({
    //
    // Implements \FormInput[size][class]{name}
    //
    FormInput: function (name) {
      var size = this.GetBrackets(name),
          cls = this.GetBrackets(name),
          val = this.GetBrackets(name),
          id = this.GetArgument(name);
      if (size == null || size === "") {size = "2"}
      if (val == null) {val = ""}
      cls = ("MathJax_Input "+(cls||"")).replace(/ +$/,"");
      var input = HTML.Element("input",{type:"text", name:id, id:id, size:size, className:cls, value:val});
      input.setAttribute("xmlns","http://www.w3.org/1999/xhtml");
      var mml = MML["annotation-xml"](MML.xml(input)).With({encoding:"application/xhtml+xml",isToken:true});
      this.Push(MML.semantics(mml));
    }
  });
  
}));

MathJax.Ajax.loadComplete("[MathJax]/extensions/TeX/forminput.js");

