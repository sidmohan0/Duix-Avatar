# CPU shim for running the duix.avatar service without an NVIDIA GPU (e.g. on
# Apple Silicon under Rosetta emulation).
#
# The inference code (compiled Cython) hardcodes CUDA calls such as
# torch.cuda.set_device() and Tensor.cuda(). Python auto-imports this module at
# interpreter startup when it is mounted into site-packages, and it remaps
# those calls to CPU equivalents. See docker-compose-mac.yml.
try:
    import torch
except ImportError:  # not a torch process, nothing to do
    torch = None

if torch is not None:
    torch.cuda.is_available = lambda: False
    torch.cuda.device_count = lambda: 0
    torch.cuda.set_device = lambda *a, **k: None
    torch.cuda.current_device = lambda: 0
    torch.cuda.synchronize = lambda *a, **k: None
    torch.cuda.empty_cache = lambda: None
    torch.cuda.get_device_name = lambda *a, **k: 'CPU (shim)'

    def _is_cuda(device):
        return device is not None and 'cuda' in str(device)

    def _remap(args, kwargs):
        args = tuple('cpu' if _is_cuda(a) else a for a in args)
        if _is_cuda(kwargs.get('device')):
            kwargs = {**kwargs, 'device': 'cpu'}
        return args, kwargs

    torch.Tensor.cuda = lambda self, *a, **k: self.cpu()
    torch.nn.Module.cuda = lambda self, *a, **k: self.cpu()

    _tensor_to = torch.Tensor.to

    def _tensor_to_cpu(self, *args, **kwargs):
        args, kwargs = _remap(args, kwargs)
        return _tensor_to(self, *args, **kwargs)

    torch.Tensor.to = _tensor_to_cpu

    _module_to = torch.nn.Module.to

    def _module_to_cpu(self, *args, **kwargs):
        args, kwargs = _remap(args, kwargs)
        return _module_to(self, *args, **kwargs)

    torch.nn.Module.to = _module_to_cpu

    _load = torch.load

    def _load_cpu(*args, **kwargs):
        kwargs['map_location'] = 'cpu'
        return _load(*args, **kwargs)

    torch.load = _load_cpu

    _jit_load = torch.jit.load

    def _jit_load_cpu(*args, **kwargs):
        kwargs['map_location'] = 'cpu'
        return _jit_load(*args, **kwargs)

    torch.jit.load = _jit_load_cpu

try:
    import onnxruntime
except ImportError:
    onnxruntime = None

if onnxruntime is not None:
    # Sessions are created with an explicit CUDAExecutionProvider, which fails
    # hard without a GPU instead of falling back. Force CPU.
    _InferenceSession = onnxruntime.InferenceSession

    def _cpu_session(path_or_bytes, sess_options=None, providers=None, provider_options=None, **kwargs):
        return _InferenceSession(
            path_or_bytes,
            sess_options=sess_options,
            providers=['CPUExecutionProvider'],
            provider_options=None,
            **kwargs
        )

    onnxruntime.InferenceSession = _cpu_session
    onnxruntime.get_available_providers = lambda: ['CPUExecutionProvider']

    _Session = onnxruntime.capi.onnxruntime_inference_collection.Session
    _set_providers = _Session.set_providers

    def _cpu_set_providers(self, providers=None, provider_options=None):
        return _set_providers(self, ['CPUExecutionProvider'], None)

    _Session.set_providers = _cpu_set_providers
