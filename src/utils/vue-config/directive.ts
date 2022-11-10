export function registerDirective(app: any) {
	app.directive('click-outside', {
		beforeMount(el: any, binding: any, vnode: any) {
			// event.target ==> chính là phần tử mà click chuột vào
			// el ==> chính là thằng đang muốn nhận sự kiện clickOutside
			el.clickOutsideEvent = (event: Event) => {
				if (!(el === event.target || el.contains(event.target))) {
					binding.value(event, el)
				}
			}
			document.body.addEventListener('click', el.clickOutsideEvent)
		},
		unmounted(el: any) {
			document.body.removeEventListener('click', el.clickOutsideEvent)
		},
	})
}
